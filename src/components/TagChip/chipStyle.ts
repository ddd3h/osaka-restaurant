import type { CSSProperties } from 'react'
import { tagColor, tagTextColor } from '../../lib/tagColor'

/**
 * タグ色は自由タグ由来なので CSS 側では決められない。
 * インラインの custom property で渡し、実際の見た目は各 module.css が使う。
 */
export function chipStyle(tag: string): CSSProperties {
  return {
    '--chip-bg': tagColor(tag),
    '--chip-fg': tagTextColor(tag),
  } as CSSProperties
}
