/** restaurants.json の 1 レコード。id / name / emoji / tags / area / lat / lng / comment が必須。 */
export type Restaurant = {
  /** URL に載るスラッグ。半角英数とハイフンのみ。例: "wanaka-sennichimae" */
  id: string
  /** 店名 */
  name: string
  /** ひらがな読み。検索のゆれ吸収に使う（任意だが入れると検索が強くなる） */
  kana?: string
  /** photo が無いときだけ使う代替アイコン。例: "🐙" */
  emoji: string
  /** 自由タグ。ここに書いたものがそのままフィルターのチップになる */
  tags: string[]
  /** エリア名。例: "難波" */
  area: string
  lat: number
  lng: number
  /** src/photos/<id>/ を使わないときのフォールバック 1 枚。public/ からの相対パス。例: "photos/wanaka.svg" */
  photo?: string
  /** 紹介コメント（本文） */
  comment: string
  /** 予算表記。例: "¥1,000〜2,000" */
  budget?: string
  /**
   * 食べログの点数（1〜5、実際はだいたい 3.0〜3.9）。
   * `npm run ratings` が書き込む機械管理のフィールドなので手で書かない。
   * 食べログにページが無い店は undefined のまま。
   */
  rating?: number
  address?: string
  hours?: string
  /** 公式サイトや食べログ */
  url?: string
  /** Google Maps へのリンク */
  mapUrl?: string
}

/** loadRestaurants() が返す、検索用インデックスを付けた形。 */
export type IndexedRestaurant = Restaurant & {
  /** name + kana + tags + area + comment を正規化して連結した検索対象文字列 */
  searchIndex: string
  /**
   * 表示に使う解決済みの写真 URL。
   * src/photos/<id>/ があればそれ、無ければ restaurants.json の photo 1 枚、どちらも無ければ空。
   */
  gallery: string[]
  /**
   * 代表写真の縮小版 URL。地図のピンとカードのサムネはこれを使う。
   * 原寸を並べると初回表示が出そろわないため。写真が無ければ undefined。
   */
  cover?: string
}

/** 距離計算が済んだ状態。distanceM は現在地未取得なら undefined。 */
export type ListedRestaurant = IndexedRestaurant & {
  distanceM?: number
}

export type SortKey = 'recommended' | 'score' | 'nearest'

export type FilterCriteria = {
  query: string
  /** 選択中のタグ。複数選択は AND */
  tags: string[]
  favoritesOnly: boolean
  favorites: ReadonlySet<string>
}
