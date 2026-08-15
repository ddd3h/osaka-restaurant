import { chipStyle } from './chipStyle'
import styles from './TagChip.module.css'

type Props = {
  tag: string
  size?: 'sm' | 'md'
}

/** 表示専用のタグチップ（カード・詳細で使う）。 */
export function TagChip({ tag, size = 'sm' }: Props) {
  return (
    <span className={`${styles.chip} ${styles[size]}`} style={chipStyle(tag)}>
      {tag}
    </span>
  )
}
