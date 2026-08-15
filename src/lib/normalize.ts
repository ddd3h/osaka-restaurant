const KATAKANA_START = 0x30a1 // ァ
const KATAKANA_END = 0x30f6 // ヶ
const KANA_OFFSET = 0x60 // カタカナ → ひらがな の差分

/**
 * 検索の表記ゆれを吸収する。
 *
 * 1. NFKC 正規化（半角カナ → 全角カナ、全角英数 → 半角英数、全角スペース → 半角）
 * 2. カタカナ → ひらがな
 * 3. 小文字化 + 前後の空白除去
 *
 * これで「たこやき / タコヤキ / ﾀｺﾔｷ」が同じ文字列になる。
 */
export function normalize(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[ァ-ヶ]/g, (char) => {
      const code = char.charCodeAt(0)
      return code >= KATAKANA_START && code <= KATAKANA_END
        ? String.fromCharCode(code - KANA_OFFSET)
        : char
    })
    .toLowerCase()
    .trim()
}

/** 検索語を空白区切りのトークンに分解する（各トークンは normalize 済み）。 */
export function tokenize(query: string): string[] {
  const n = normalize(query)
  return n === '' ? [] : n.split(/\s+/)
}
