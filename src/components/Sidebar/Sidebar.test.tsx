import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Sidebar } from './Sidebar'
import { useFavorites } from '../../hooks/useFavorites'
import { useFilters } from '../../hooks/useFilters'
import { useRestaurants } from '../../hooks/useRestaurants'

/** App と同じつなぎ方で Sidebar だけを動かす（地図は使わない）。 */
function Harness() {
  const favorites = useFavorites()
  const restaurants = useRestaurants(null)
  const filters = useFilters(restaurants, favorites.favorites)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <Sidebar
      filters={filters}
      favorites={favorites}
      geo={{ status: 'idle', position: null, error: null, request: () => {} }}
      totalCount={restaurants.length}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onHover={() => {}}
      onSortChange={filters.setSort}
      mode="map"
      onModeChange={() => {}}
    />
  )
}

const names = () =>
  screen.queryAllByRole('heading', { level: 3 }).map((el) => el.textContent ?? '')

/**
 * サイドバーのタグ欄は上位8件だけ出して残りを畳んでいる。
 * 出現数の少ないタグを触るテストは、先に「もっと見る」で開いておく。
 */
async function expandTags(user: ReturnType<typeof userEvent.setup>) {
  const more = screen.queryByRole('button', { name: /もっと見る/ })
  if (more) await user.click(more)
}

describe('Sidebar', () => {
  it('最初は全件表示する', () => {
    render(<Harness />)
    expect(names().length).toBeGreaterThanOrEqual(10)
    expect(names().some((n) => n.includes('きじ'))).toBe(true)
  })

  it('カタカナで検索しても漢字かな表記の店に当たる', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText('お店を検索'), 'アイヅヤ')

    expect(names()).toEqual(['会津屋 梅田HEP NAVIO店'])
  })

  it('検索をクリアすると元に戻る', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const before = names().length

    await user.type(screen.getByLabelText('お店を検索'), 'アイヅヤ')
    await user.click(screen.getByRole('button', { name: '検索をクリア' }))

    expect(names()).toHaveLength(before)
  })

  it('タグをクリックすると絞り込まれ、もう一度押すと解除される', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await expandTags(user)
    const chip = screen.getByRole('button', { name: /^粉モン/ })
    await user.click(chip)

    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(names().some((n) => n.includes('CAROSELLO'))).toBe(false)
    expect(names().some((n) => n.includes('きじ'))).toBe(true)

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('タグは複数選ぶと AND になる', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await expandTags(user)
    await user.click(screen.getByRole('button', { name: /^粉モン/ }))
    const withKonamon = names().length
    await user.click(screen.getByRole('button', { name: /^安い/ }))

    expect(names().length).toBeLessThan(withKonamon)
  })

  it('該当0件なら空状態とリセットが出る', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText('お店を検索'), 'ざるそば')

    expect(screen.getByText('その条件のお店はまだないです')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'しぼり込みをリセット' }))
    expect(names().length).toBeGreaterThan(0)
  })

  it('お気に入りに入れて「お気に入り」で絞れる', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const card = screen.getByRole('heading', { name: 'ゴメンネJIRO' }).closest('article')
    await user.click(within(card as HTMLElement).getByRole('button', { name: /お気に入りに追加/ }))

    await user.click(screen.getByRole('button', { name: 'お気に入りのみ表示' }))

    expect(names()).toEqual(['ゴメンネJIRO'])
  })

  it('お気に入りは localStorage に残る', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness />)

    const card = screen.getByRole('heading', { name: 'EL ALMA（エルアルマ）' }).closest('article')
    await user.click(within(card as HTMLElement).getByRole('button', { name: /お気に入りに追加/ }))
    unmount()

    render(<Harness />)
    const again = screen.getByRole('heading', { name: 'EL ALMA（エルアルマ）' }).closest('article')
    expect(
      within(again as HTMLElement).getByRole('button', { name: /お気に入りから外す/ }),
    ).toBeInTheDocument()
  })
})
