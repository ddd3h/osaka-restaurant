import { useId, useMemo, useState } from 'react'
import type { TagFacet } from '../../hooks/useFilters'
import { MOBILE_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { chipStyle } from '../TagChip/chipStyle'
import styles from './TagFilter.module.css'

/**
 * 折りたたんでいるときに出すチップの数。
 * 「＋もっと見る」もチップ1つぶんの幅を取るので、それ込みで1行に収まる数にしている。
 */
const COLLAPSED_COUNT = 4
/** 狭い画面では「＋もっと見る」が次の行へ落ちてしまうので1つ減らす */
const COLLAPSED_COUNT_MOBILE = 3

type Props = {
  facets: TagFacet[]
  onToggle: (tag: string) => void
  /** true なら上位だけ出して残りを「＋もっと見る」に隠す */
  collapsible?: boolean
}

/**
 * 折りたたみ時に見せるチップを選ぶ。
 * 選択中のタグは**必ず残す**（隠れると解除できなくなるため）。
 * 残り枠を出現数の多い順で埋め、並びは元の順序のままにする。
 */
function visibleFacets(facets: TagFacet[], collapsed: boolean, limit: number): TagFacet[] {
  if (!collapsed || facets.length <= limit) return facets

  const keep = new Set(facets.filter((f) => f.selected).map((f) => f.tag))
  for (const f of facets) {
    if (keep.size >= limit) break
    keep.add(f.tag)
  }
  return facets.filter((f) => keep.has(f.tag))
}

export function TagFilter({ facets, onToggle, collapsible = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const listId = useId()

  const limit = isMobile ? COLLAPSED_COUNT_MOBILE : COLLAPSED_COUNT
  const collapsed = collapsible && !expanded
  const shown = useMemo(
    () => visibleFacets(facets, collapsed, limit),
    [facets, collapsed, limit],
  )
  const hiddenCount = facets.length - shown.length

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>
        タグでしぼる <span className={styles.hint}>複数選ぶと AND</span>
      </h2>
      <ul className={styles.list} id={listId}>
        {shown.map(({ tag, count, selected }) => (
          <li key={tag}>
            <button
              type="button"
              className={styles.chip}
              style={chipStyle(tag)}
              data-selected={selected}
              data-empty={!selected && count === 0}
              aria-pressed={selected}
              onClick={() => onToggle(tag)}
            >
              {tag}
              <span className={styles.count} aria-hidden="true">
                {count}
              </span>
              <span className="srOnly">{selected ? '選択中' : `${count}件`}</span>
            </button>
          </li>
        ))}

        {collapsible && (hiddenCount > 0 || expanded) && (
          <li>
            <button
              type="button"
              className={styles.more}
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? '− とじる' : `＋ もっと見る`}
              {!expanded && (
                <span className={styles.count} aria-hidden="true">
                  {hiddenCount}
                </span>
              )}
              {!expanded && <span className="srOnly">残り{hiddenCount}件のタグ</span>}
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
