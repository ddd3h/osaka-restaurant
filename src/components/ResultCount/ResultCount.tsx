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
 * 一覧に重ねて浮かせるので、**要素ごとに丸い下地を持つ**。
 * 置き場所（横並びや右寄せ）は親に任せたいので、まとめる箱は作らず並べるだけにする。
 */
export function ResultCount({ shown, total, isActive, onReset }: Props) {
  return (
    <>
      <p className={styles.count}>
        <strong>{shown}</strong> / {total} 軒
      </p>
      {isActive && (
        <button type="button" className={styles.reset} onClick={onReset}>
          リセット
        </button>
      )}
    </>
  )
}
