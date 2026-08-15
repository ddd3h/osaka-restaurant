/**
 * 自由タグなので色を手で指定できない。
 * タグ文字列のハッシュからパレットを引き、同じタグには常に同じ色を割り当てる。
 */

/** index.css の --tag-0 〜 --tag-7 と 1:1 で対応（順序を変えたら両方直すこと）。 */
const TAG_HEX = [
  '#ff2e88',
  '#ffc400',
  '#00d9c0',
  '#7b5cff',
  '#ff7a3d',
  '#3dc2ff',
  '#ff5c9e',
  '#6fd943',
] as const

export const TAG_PALETTE_SIZE = TAG_HEX.length

export function tagColorIndex(tag: string): number {
  let hash = 0
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  }
  return hash % TAG_PALETTE_SIZE
}

/** チップの背景色（CSS カスタムプロパティ参照）。 */
export function tagColor(tag: string): string {
  return `var(--tag-${tagColorIndex(tag)})`
}

/** 背景の明るさから、読める文字色を選ぶ。 */
export function tagTextColor(tag: string): string {
  return isLight(TAG_HEX[tagColorIndex(tag)]) ? 'var(--plum)' : 'var(--white)'
}

/** WCAG の相対輝度で明暗を判定する。 */
function isLight(hex: string): boolean {
  const channel = (offset: number) => {
    const v = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
  return luminance > 0.45
}
