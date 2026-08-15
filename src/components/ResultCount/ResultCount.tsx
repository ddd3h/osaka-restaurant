import styles from './ResultCount.module.css'

type Props = {
  shown: number
  total: number
  /** 何かで絞り込み中か。true のときだけリセットを出す */
  isActive: boolean
  onReset: () => void
}

/**
 * 「18 / 49 軒」とリセット。
 *
 * 絞り込みバーではなく**一覧の直前**に置く。数えているのは下に並ぶものなので、
 * 結果のすぐ上にあるほうが結び付きが分かりやすく、狭い画面で検索欄の幅も削らない。
 */
export function ResultCount({ shown, total, isActive, onReset }: Props) {
  return (
    <p className={styles.count}>
      <strong>{shown}</strong> / {total} 軒
      {isActive && (
        <button type="button" className={styles.reset} onClick={onReset}>
          リセット
        </button>
      )}
    </p>
  )
}
