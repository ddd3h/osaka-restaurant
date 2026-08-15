import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TagFilter } from './TagFilter'
import type { TagFacet } from '../../hooks/useFilters'

/** 出現数の多い順に並んだ facets を作る（useFilters が返す並びと同じ）。 */
function makeFacets(count: number, selected: string[] = []): TagFacet[] {
  return Array.from({ length: count }, (_, i) => ({
    tag: `タグ${i + 1}`,
    count: count - i,
    selected: selected.includes(`タグ${i + 1}`),
  }))
}

const chipNames = () =>
  screen
    .getAllByRole('button')
    .map((b) => b.textContent ?? '')
    .filter((t) => !t.includes('もっと見る') && !t.includes('とじる'))

describe('TagFilter', () => {
  it('collapsible でなければ全部出す', () => {
    render(<TagFilter facets={makeFacets(22)} onToggle={() => {}} />)

    expect(chipNames()).toHaveLength(22)
    expect(screen.queryByRole('button', { name: /もっと見る/ })).toBeNull()
  })

  it('折りたたむと上位4件＋「もっと見る」だけになる', () => {
    render(<TagFilter facets={makeFacets(22)} onToggle={() => {}} collapsible />)

    expect(chipNames()).toHaveLength(4)
    // 残り18件ぶんの案内が出る
    expect(screen.getByRole('button', { name: /残り18件のタグ/ })).toBeInTheDocument()
  })

  it('「もっと見る」で全部出て、「とじる」で戻る', async () => {
    const user = userEvent.setup()
    render(<TagFilter facets={makeFacets(22)} onToggle={() => {}} collapsible />)

    const more = screen.getByRole('button', { name: /もっと見る/ })
    expect(more).toHaveAttribute('aria-expanded', 'false')

    await user.click(more)
    expect(chipNames()).toHaveLength(22)

    const close = screen.getByRole('button', { name: /とじる/ })
    expect(close).toHaveAttribute('aria-expanded', 'true')

    await user.click(close)
    expect(chipNames()).toHaveLength(4)
  })

  it('選択中のタグは、順位が下でも折りたたみ時に必ず残る', () => {
    // タグ22 は出現数が最下位なので、素直に上位4件を取ると消えてしまう
    render(
      <TagFilter facets={makeFacets(22, ['タグ22'])} onToggle={() => {}} collapsible />,
    )

    expect(screen.getByRole('button', { name: /タグ22.*選択中/ })).toBeInTheDocument()
    expect(chipNames()).toHaveLength(4)
  })

  it('4件以下なら「もっと見る」は出ない', () => {
    render(<TagFilter facets={makeFacets(4)} onToggle={() => {}} collapsible />)

    expect(chipNames()).toHaveLength(4)
    expect(screen.queryByRole('button', { name: /もっと見る/ })).toBeNull()
  })

  it('チップを押すと onToggle がタグ名付きで呼ばれる', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<TagFilter facets={makeFacets(5)} onToggle={onToggle} collapsible />)

    await user.click(screen.getByRole('button', { name: /^タグ3/ }))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('タグ3')
  })
})
