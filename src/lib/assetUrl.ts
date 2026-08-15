/**
 * public/ 配下のファイルへの URL を作る。
 * GitHub Pages ではサイトが /<repo>/ 配下に載るので、必ず BASE_URL を前置すること。
 */
export function assetUrl(path: string | undefined): string | undefined {
  if (!path) return undefined
  if (/^(https?:)?\/\//.test(path)) return path
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
