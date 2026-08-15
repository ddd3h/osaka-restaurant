/**
 * 食べログ点数の表示用フォーマット。
 *
 * JSON は小数の末尾 0 を保てないので（`JSON.parse("3.50") === 3.5`）、
 * そのまま出すと 3.66 の隣に 3.5 が並んで桁が揃わない。
 * 食べログの表記に合わせて必ず小数第2位まで出す。
 */
export function formatScore(score: number): string {
  return score.toFixed(2)
}
