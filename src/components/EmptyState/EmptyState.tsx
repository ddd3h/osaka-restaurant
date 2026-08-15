import { Icon } from '../Icon/Icon'
import styles from './EmptyState.module.css'

type Props = {
  onReset: () => void
}

export function EmptyState({ onReset }: Props) {
  return (
    <div className={styles.wrap}>
      <p className={styles.emoji}>
        <Icon name="utensils" size={40} />
      </p>
      <p className={styles.title}>その条件のお店はまだないです</p>
      <p className={styles.text}>タグを減らすか、キーワードを短くしてみてください。</p>
      <button type="button" className={styles.reset} onClick={onReset}>
        しぼり込みをリセット
      </button>
    </div>
  )
}
