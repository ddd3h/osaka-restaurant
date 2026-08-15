/**
 * 食べログ点数まわりの純関数。ネットワークもファイルも触らない。
 * I/O は scripts/fetch-tabelog-ratings.mjs 側に置いてある。
 */

/** rating を挿入する位置。この順で最初に見つかったキーの直後に入れる。 */
const RATING_ANCHORS = ['budget', 'comment']

/**
 * 食べログの店舗ページ HTML から点数を取り出す。
 * 取れない・数値にならない・1〜5 の範囲外なら null（呼び出し側で「失敗」として扱う）。
 */
export function extractScore(html) {
  // 店舗ヘッダーの点数表示。これが正。
  const header = html.match(/rdheader-rating__score-val-dtl">([0-9.]+)<\/span>/)
  // 予備。JSON-LD の aggregateRating。2件目以降は個別レビューの点数なので先頭だけ見る。
  const jsonLd = header ? null : html.match(/"ratingValue"\s*:\s*"?([0-9.]+)"?/)

  const raw = header?.[1] ?? jsonLd?.[1]
  if (raw === undefined) return null

  const score = Number(raw)
  if (!Number.isFinite(score) || score < 1 || score > 5) return null
  return Math.round(score * 100) / 100
}

/**
 * restaurants.json を既存の整形のまま書き戻す。
 *
 * JSON.stringify(data, null, 2) は tags などの配列を1要素1行に展開してしまい、
 * 数行の変更が全行の差分になって読めなくなる。文字列配列は1行に畳む。
 * キーの順は入力オブジェクトの順をそのまま使う（JSON.parse は記載順を保つ）。
 */
export function formatRestaurantsJson(list) {
  const records = list.map((r) => {
    const lines = Object.keys(r).map((key) => `    ${JSON.stringify(key)}: ${formatValue(r[key])}`)
    return `  {\n${lines.join(',\n')}\n  }`
  })
  return `[\n${records.join(',\n')}\n]\n`
}

/** 文字列だけの配列は1行に畳む。それ以外は JSON.stringify 任せ。 */
function formatValue(value) {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`
  }
  return JSON.stringify(value)
}

/**
 * rating を設定した新しいレコードを返す（入力は書き換えない）。
 * 既にあれば値だけ差し替え、無ければ budget（無ければ comment）の直後に挿入する。
 */
export function withRating(record, rating) {
  if ('rating' in record) {
    return Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k, k === 'rating' ? rating : v]),
    )
  }

  const anchor = RATING_ANCHORS.find((key) => key in record)
  const out = {}
  for (const [k, v] of Object.entries(record)) {
    out[k] = v
    if (k === anchor) out.rating = rating
  }
  // アンカーが1つも無い壊れたレコードでも rating は落とさない
  if (!('rating' in out)) out.rating = rating
  return out
}
