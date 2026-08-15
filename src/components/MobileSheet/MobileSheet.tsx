import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import styles from './MobileSheet.module.css'

type Snap = 'peek' | 'half' | 'full'

/** スナップ位置（画面高に対する %）。peek はピンが隠れない高さ。 */
const SNAP_VH: Record<Snap, number> = { peek: 26, half: 58, full: 92 }
const ORDER: Snap[] = ['peek', 'half', 'full']
const DRAG_THRESHOLD_PX = 6

type Props = {
  children: ReactNode
}

/** モバイル用のボトムシート。ハンドルをドラッグ、またはタップで3段階に切り替える。 */
export function MobileSheet({ children }: Props) {
  const [snap, setSnap] = useState<Snap>('peek')
  const [dragVh, setDragVh] = useState<number | null>(null)
  const drag = useRef<{ startY: number; startVh: number; moved: boolean } | null>(null)

  const heightVh = dragVh ?? SNAP_VH[snap]

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startVh: SNAP_VH[snap], moved: false }
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const deltaPx = d.startY - e.clientY
    if (Math.abs(deltaPx) > DRAG_THRESHOLD_PX) d.moved = true
    const vh = d.startVh + (deltaPx / window.innerHeight) * 100
    setDragVh(Math.min(95, Math.max(14, vh)))
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null

    if (!d) return
    if (!d.moved) {
      // タップは次の段へ（一番上まで行ったら peek に戻る）
      setSnap(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length])
      setDragVh(null)
      return
    }

    const current = dragVh ?? d.startVh
    const nearest = ORDER.reduce((best, key) =>
      Math.abs(SNAP_VH[key] - current) < Math.abs(SNAP_VH[best] - current) ? key : best,
    )
    setSnap(nearest)
    setDragVh(null)
  }

  return (
    <section
      className={styles.sheet}
      style={{ height: `${heightVh}dvh` }}
      data-dragging={dragVh !== null}
      aria-label="お店リスト"
    >
      <button
        type="button"
        className={styles.handle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className={styles.grip} aria-hidden="true" />
        <span className="srOnly">リストの高さを変える（現在: {snap}）</span>
      </button>
      <div className={styles.content}>{children}</div>
    </section>
  )
}
