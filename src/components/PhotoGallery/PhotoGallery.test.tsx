import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PhotoGallery } from './PhotoGallery'

const THREE = ['/photos/a.svg', '/photos/b.svg', '/photos/c.svg']
const NAME = 'たこ焼き たこ吉'

function renderGallery(photos: string[]) {
  return render(<PhotoGallery photos={photos} name={NAME} />)
}

/** メイン画像は alt が付いている1枚だけ（サムネの img は alt=""） */
const mainImg = () => screen.getByAltText(new RegExp(`^${NAME}の写真`))

describe('PhotoGallery', () => {
  it('写真が2枚以上ならサムネ列と枚数バッジを出す', () => {
    renderGallery(THREE)

    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByRole('button', { name: '2枚目を表示' })).toBeInTheDocument()
    expect(mainImg().getAttribute('src')).toBe(THREE[0])
    expect(mainImg()).toHaveAttribute('alt', `${NAME}の写真 3枚中1枚目`)
  })

  it('写真が1枚ならサムネ列も枚数バッジも出さない', () => {
    const { container } = renderGallery([THREE[0]])

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryByText('1 / 1')).toBeNull()
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(mainImg().getAttribute('src')).toBe(THREE[0])
  })

  it('写真が0枚なら img は1枚も無い', () => {
    const { container } = renderGallery([])

    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('サムネを押すとメイン画像の src が入れ替わり aria-pressed も移る', async () => {
    const user = userEvent.setup()
    renderGallery(THREE)

    const first = screen.getByRole('button', { name: '1枚目を表示' })
    const third = screen.getByRole('button', { name: '3枚目を表示' })
    expect(first).toHaveAttribute('aria-pressed', 'true')

    await user.click(third)

    expect(mainImg().getAttribute('src')).toBe(THREE[2])
    expect(third).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('ArrowRight / ArrowLeft で前後に動き、端では止まる', async () => {
    const user = userEvent.setup()
    renderGallery(THREE)

    // ルートの onKeyDown まで上げたいので、まずサムネにフォーカスを置く
    await user.click(screen.getByRole('button', { name: '1枚目を表示' }))

    // 左端ではそれ以上戻らない
    await user.keyboard('{ArrowLeft}')
    expect(mainImg().getAttribute('src')).toBe(THREE[0])

    await user.keyboard('{ArrowRight}')
    expect(mainImg().getAttribute('src')).toBe(THREE[1])

    await user.keyboard('{ArrowRight}')
    expect(mainImg().getAttribute('src')).toBe(THREE[2])
    expect(screen.getByRole('button', { name: '3枚目を表示' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // 右端ではそれ以上進まない
    await user.keyboard('{ArrowRight}')
    expect(mainImg().getAttribute('src')).toBe(THREE[2])

    await user.keyboard('{ArrowLeft}')
    expect(mainImg().getAttribute('src')).toBe(THREE[1])
  })
})
