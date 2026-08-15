# 写真の入れ方

写真は **地図の丸ピン / カードのサムネ / 詳細パネルのギャラリー** の3か所で使われる。

## 置き場所は2つ

| 置き場所 | 枚数 | `restaurants.json` の編集 | 使いどころ |
| --- | --- | --- | --- |
| `src/photos/<店id>/` | 複数枚 | **不要**（自動で拾われる） | ギャラリーを見せたい店 |
| `public/photos/` + `photo` | 1枚 | 必要（`photo` にパスを書く） | とりあえず1枚だけ |

優先順位は **`src/photos/<店id>/` → `photo` 1枚 → `emoji`**。
同じ店に両方あればフォルダのほうが勝つ。どちらも無ければ絵文字が出る。

この解決は `src/data/loadRestaurants.ts` の `galleryFor()` が担当し、
結果が `IndexedRestaurant.gallery: string[]`（解決済みURLの配列）として全画面に配られる。

---

## 複数枚見せたい店 → `src/photos/<店id>/`

店 id と同じ名前のフォルダを作って画像を放り込むだけ。
Vite の `import.meta.glob` がビルド時に収集する（`src/data/photos.ts`）。

```
src/photos/
  kiji-honten/
    01-外観.jpg
    02-モダン焼き.jpg
    03-鉄板.jpg
  el-alma/
    01.jpg
    02.jpg
```

- **フォルダ名は `restaurants.json` の `id` と完全一致**させること。
  `"id": "kiji-honten"` → `src/photos/kiji-honten/`。一致しないと拾われない。
- **並び順はファイル名の自然順**。数値として比較するので `2.jpg` は `10.jpg` より前に来る。
  とはいえ `01-` `02-` と**連番を先頭に付ける**のが確実で読みやすい。
- 対応拡張子は `.jpg` `.jpeg` `.png` `.webp` `.avif`。
  増やすときは `src/data/photos.ts` の glob パターンを直す。
- Vite がハッシュ付きURLに変換するので、キャッシュが効く。
  返ってきたURLは**そのまま `<img src>` に使える**（`assetUrl()` を通してはいけない。
  あれは `public/` 配下のファイル専用）。

### 注意: glob はビルド時に確定する

`import.meta.glob` は静的解析なので、**dev サーバー起動中にフォルダを足したら
Vite の再起動が要る**ことがある。反映されないときは dev を再起動する。

---

## 1枚でいい店 → `public/photos/`

`public/photos/` に画像を置き、`photo` に `public/` からの相対パスを書く。

```jsonc
"photo": "photos/wanaka.jpg"
```

`public/` の中身は加工されず、そのままのパスで配信される。
GitHub Pages ではサイトが `/osaka-restaurant/` 配下に載るので、
コード側では必ず `assetUrl()`（`import.meta.env.BASE_URL` を前置）を通して解決している。
**JSON には `/` 始まりの絶対パスを書かないこと。**

---

## 構図とサイズ

### 構図

- **丸ピンとカードのサムネ**は **1枚目を中央で正方形に切り抜く**（`object-fit: cover`）。
  料理や店構えが**中央に来る構図**を1枚目に持ってくるときれいに出る。
- **詳細パネル**は 16:10 の大きめ1枚 + 下のサムネ列。置いた写真は全部見られる。

### サイズ — 縮小はビルドがやる

**手で縮める必要はない。** ピンとサムネ用の縮小版は
[vite-imagetools](https://github.com/JonasKruckenberg/imagetools) がビルド時に作る。

| 用途 | 実際に配信されるもの | 読み込みタイミング |
| --- | --- | --- |
| 地図のピン（46px角）・カードのサムネ（92px角） | **幅200px の webp（1枚 3〜12kB）** | 表示中の全店ぶんを同時に |
| 詳細パネルのギャラリー | 置いた原寸のまま | 詳細を開いたときだけ |

しくみは `src/data/photos.ts` に2本の glob がある。原寸用（`?url`）と
縮小版用（`?w=200&format=webp&quality=72`）で、後者が
`IndexedRestaurant.cover` になってピンとサムネに配られる。

> **なぜ要るのか**: 原寸（実測 856×570・平均120kB）を49店ぶん一度に読むと
> 初回で 5.8MB 流れて、写真が出そろうまで白いままになる。
> 縮小版に切り替えて 0.31MB まで落とした（18分の1）。
>
> 原寸を直接ピンに使う実装へ戻すと、この症状がそのまま再発する。

置く写真そのものは、**長辺1600px程度**あればギャラリーで十分きれいに出る。
それ以上大きくても表示は変わらず、リポジトリとビルド時間が増えるだけ。

---

## ギャラリーの挙動（`src/components/PhotoGallery/`）

- 上に大きめ1枚、右下に `2 / 4` のバッジ、下に横スクロールのサムネ列。
- 選択中のサムネはピンク枠 + ズレ影、`aria-pressed="true"`。
- **写真1枚の店はサムネ列もバッジも出ない**（1枚だけの見た目になる）。
- 写真0枚なら `emoji` を大きく出す。
- ← → キーで前後に送れる（端では止まる。ループしない）。
- 表示中の枚数は内部 state なので、**呼び出し側が `key={r.id}` を渡して**
  店が変わったらコンポーネントごと作り直す。`DetailPanel.tsx` がそうしている。
  これを外すと前の店の「3枚目」が次の店に引き継がれる。

---

## SNS カード（OGP）

X や LINE に貼ったときに出る画像は `public/ogp.jpg`（**1200x630**）。
差し替えるときは同じ寸法に揃える。比率が違うと切り取られる。

**参照は絶対URLで書くこと。** 相対パスを解決してくれないクローラーが多い。
`index.html` の `%VITE_SITE_URL%` がビルド時に `.env` の値へ置き換わる仕組みにしてあるので、
**公開先を変えたら `.env` の `VITE_SITE_URL` も末尾スラッシュ込みで直す**。

反映を確認したいときは、各社のデバッガにURLを入れてキャッシュを更新する:

- X: https://cards-dev.twitter.com/validator
- Facebook: https://developers.facebook.com/tools/debug/
