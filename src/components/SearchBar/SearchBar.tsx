import { Icon } from '../Icon/Icon'
import styles from './SearchBar.module.css'

type Props = {
  value: string
  onChange: (v: string) => void
  resultCount: number
}

export function SearchBar({ value, onChange, resultCount }: Props) {
  return (
    <div className={styles.wrap}>
      <span className={styles.icon}>
        <Icon name="search" />
      </span>
      <input
        id="search"
        className={styles.input}
        type="search"
        value={value}
        placeholder="店名・エリア・タグで探す"
        aria-label="お店を検索"
        aria-describedby="search-count"
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {value !== '' && (
        <button className={styles.clear} type="button" onClick={() => onChange('')}>
          <Icon name="close" size={15} />
          <span className="srOnly">検索をクリア</span>
        </button>
      )}
      {/* 検索結果の件数変化をスクリーンリーダーに伝える */}
      <p id="search-count" className="srOnly" aria-live="polite">
        {resultCount}件のお店
      </p>
    </div>
  )
}
