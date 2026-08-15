import type { ViewMode } from '../../hooks/useViewMode'
import { Icon } from '../Icon/Icon'
import styles from './ViewToggle.module.css'

type Props = {
  mode: ViewMode
  onChange: (m: ViewMode) => void
}

/**
 * 地図表示とグリッド表示を切り替える2択セグメント。
 *
 * 絞り込みの帯は横幅の取り合いになるのでアイコンだけにしている。
 * アイコンは読み上げから外し、「地図表示」「グリッド表示」という言葉のほうを
 * srOnly と title で持たせる。
 */
export function ViewToggle({ mode, onChange }: Props) {
  return (
    <div className={styles.segment} role="group" aria-label="表示の切り替え">
      <button
        type="button"
        title="地図表示"
        data-active={mode === 'map'}
        aria-pressed={mode === 'map'}
        onClick={() => onChange('map')}
      >
        <Icon name="map" />
        <span className="srOnly">地図表示</span>
      </button>
      <button
        type="button"
        title="グリッド表示"
        data-active={mode === 'grid'}
        aria-pressed={mode === 'grid'}
        onClick={() => onChange('grid')}
      >
        <Icon name="grid" />
        <span className="srOnly">グリッド表示</span>
      </button>
    </div>
  )
}
