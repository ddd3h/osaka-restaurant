import { describe, expect, it } from 'vitest'
import { normalize, tokenize } from './normalize'

describe('normalize', () => {
  it('カタカナをひらがなに揃える', () => {
    expect(normalize('タコヤキ')).toBe('たこやき')
  })

  it('半角カタカナも同じ結果になる', () => {
    expect(normalize('ﾀｺﾔｷ')).toBe('たこやき')
  })

  it('濁点つき半角カタカナを合成して揃える', () => {
    expect(normalize('ｶﾞｰﾘｯｸ')).toBe('がーりっく')
  })

  it('全角英数を半角小文字に揃える', () => {
    expect(normalize('ＴＡＫＯ１')).toBe('tako1')
  })

  it('前後の空白を落とす', () => {
    expect(normalize('  お好み焼き 　')).toBe('お好み焼き')
  })

  it('長音記号と小書き文字は保持する', () => {
    expect(normalize('ラーメン')).toBe('らーめん')
    expect(normalize('チャーシュー')).toBe('ちゃーしゅー')
  })

  it('カタカナ・ひらがな・半角カナの3表記が同じ文字列に潰れる', () => {
    const forms = ['たこやき', 'タコヤキ', 'ﾀｺﾔｷ']
    const normalized = new Set(forms.map(normalize))
    expect(normalized.size).toBe(1)
  })
})

describe('tokenize', () => {
  it('半角スペースで分割する', () => {
    expect(tokenize('たこ 難波')).toEqual(['たこ', '難波'])
  })

  it('全角スペースでも分割する', () => {
    expect(tokenize('タコ　なんば')).toEqual(['たこ', 'なんば'])
  })

  it('空文字は空配列', () => {
    expect(tokenize('   ')).toEqual([])
  })
})
