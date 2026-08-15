/**
 * 店ごとの写真フォルダをビルド時に自動収集する。
 *
 * 使い方: `src/photos/<店id>/` に画像を置くだけで、その店のギャラリーとして拾われる。
 * 例) `src/photos/kiji-honten/01.jpg`, `src/photos/kiji-honten/02.jpg`
 * 設定ファイルへの追記は不要。フォルダ名は restaurants.json の id と完全一致させること。
 *
 * 画像は Vite がハッシュ付き URL に解決するので、返ってきた文字列はそのまま `<img src>` に使える
 * （`assetUrl()` を通してはいけない。あれは public/ 配下のファイル専用）。
 */

/** ビルド時に静的解析される glob。対応拡張子を増やすときはここのパターンを直す。 */
const modules = import.meta.glob('../photos/*/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** パスの最後のセグメント（ファイル名）を取り出す。 */
function fileNameOf(path: string): string {
  return path.split('/').at(-1) ?? path
}

/**
 * glob のキーから店 id を取り出す。
 * キーは `.../<店id>/<ファイル名>` という形なので、必ず末尾から 2 番目のセグメントを見る。
 * Vite がキーを相対パスから絶対パスに変えても壊れないようにするため、前方から数えてはいけない。
 */
export function idFromGlobKey(path: string): string | undefined {
  const id = path.split('/').at(-2)
  return id === undefined || id === '' ? undefined : id
}

/**
 * ファイル名の自然順に並べ替えた新しい配列を返す（入力は書き換えない）。
 * 数値として比較するので `2.jpg` は `10.jpg` より前に来る。
 */
export function sortByNaturalName(paths: readonly string[]): string[] {
  return [...paths].sort((a, b) =>
    fileNameOf(a).localeCompare(fileNameOf(b), undefined, { numeric: true }),
  )
}

/**
 * glob の結果を「店 id → 写真 URL の配列（自然順）」にまとめる。
 * 単体テストから任意のキーを流し込めるよう公開している。
 */
export function buildPhotoCatalog(entries: Record<string, string>): Record<string, string[]> {
  const grouped = new Map<string, string[]>()

  for (const key of Object.keys(entries)) {
    const id = idFromGlobKey(key)
    if (id === undefined) continue
    const bucket = grouped.get(id)
    if (bucket) bucket.push(key)
    else grouped.set(id, [key])
  }

  const catalog: Record<string, string[]> = {}
  for (const [id, keys] of grouped) {
    catalog[id] = sortByNaturalName(keys).map((key) => entries[key])
  }
  return catalog
}

const catalog = buildPhotoCatalog(modules)

/**
 * 店 id に対応する写真 URL を自然順で返す。該当フォルダが無ければ空配列。
 * 呼び出し側が破壊してもカタログが壊れないよう、毎回コピーを返す。
 */
export function photosFor(id: string): string[] {
  const found = catalog[id]
  return found ? [...found] : []
}
