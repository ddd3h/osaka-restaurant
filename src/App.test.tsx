import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

// maplibre-gl は WebGL を要求するので、jsdom ではダミーに差し替える
vi.mock('./components/MapView/MapView', () => ({
  MapView: () => <div data-testid="map" />,
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('トップでリストと地図が並ぶ', async () => {
    renderAt('/')
    expect(await screen.findByTestId('map')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('大阪めしMAP')
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)
  })

  it('共有リンク（/r/:id）を直接開くと詳細が出る', async () => {
    renderAt('/r/kiji-honten')
    const panel = await screen.findByRole('dialog', { name: 'お好み焼 きじ 本店 の詳細' })
    expect(panel).toBeInTheDocument()
    expect(screen.getByText(/モダン焼きが看板/)).toBeInTheDocument()
  })

  it('知らない id なら見つからない表示になる', async () => {
    renderAt('/r/nonexistent-shop')
    expect(await screen.findByText('そのお店は見つかりませんでした')).toBeInTheDocument()
  })

  it('カードを押すと詳細が開き、閉じると戻る', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await screen.findByTestId('map')

    await user.click(screen.getByRole('button', { name: /ゴメンネJIRO の詳細を見る/ }))
    expect(await screen.findByRole('dialog', { name: /ゴメンネJIRO/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '詳細を閉じる' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('読み込みでは位置情報を求めず、「近い順」を押して初めて求める', async () => {
    const user = userEvent.setup()
    const getCurrentPosition = vi.fn()
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    })

    renderAt('/')
    await screen.findByTestId('map')
    expect(getCurrentPosition).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '近い順' }))
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
  })

  it('現在地を拒否されたらおすすめ順に戻して理由を出す', async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_ok: PositionCallback, ng?: PositionErrorCallback) =>
          ng?.({
            code: 1,
            message: 'denied',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError),
      },
      configurable: true,
    })

    renderAt('/')
    await screen.findByTestId('map')
    await user.click(screen.getByRole('button', { name: '近い順' }))

    expect(await screen.findByText(/許可されませんでした/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'おすすめ順' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('Esc でも詳細を閉じられる', async () => {
    const user = userEvent.setup()
    renderAt('/r/kiji-honten')
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
