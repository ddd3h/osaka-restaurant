# 構成と設計の理由

## スタック

| 何 | 何を使っているか | なぜ |
| --- | --- | --- |
| ビルド | Vite + React + TypeScript | 静的サイトとして吐ければいいので最小構成 |
| 地図 | maplibre-gl（**v5 系に固定**） | OSS。v6 は動かない → [gotchas.md](./gotchas.md) |
| タイル | OpenFreeMap `positron` | APIキー不要・無料・無制限。灰色基調でピンが映える |
| ルーティング | react-router-dom / **HashRouter** | GitHub Pages の 404.html 回避を丸ごと不要にする |
| スタイル | CSS Modules + CSS カスタムプロパティ | Tokens を1か所に集約したかった。フレームワークは入れない |
| テスト | Vitest + Testing Library | 純ロジックと画面の振る舞いを両方 |

`react-map-gl` のようなラッパーは挟まず、**maplibre を直接叩いている**。
マーカーの DOM を自前で作りたかったのと、依存を1枚減らすため。

## ディレクトリ

```
src/
  data/       restaurants.json / 検証・検索インデックス生成 / 写真の自動収集
  photos/     店ごとの写真フォルダ。<店id>/ がその店のギャラリーになる
  lib/        純関数（正規化・距離・タグ色・絞り込み）— テストの主戦場
  hooks/      データ / 絞り込み / お気に入り / 現在地 / メディアクエリ / 地図インスタンス
  components/ 画面。各フォルダに .tsx と .module.css（+ .test.tsx）
  index.css   デザイントークン（色・影・角丸・フォント）はすべてここ
public/
  photos/     1枚だけの店のフォールバック写真（加工されず、そのままのパスで配信）
  favicon.svg / ogp.jpg（SNS カード用。1200x630）
```

## データの流れ

```
restaurants.json ─┐
                  ├→ loadRestaurants()  検証 + searchIndex + gallery を付与
src/photos/**  ───┘        │
                           ↓  IndexedRestaurant[]
              useRestaurants(現在地)   距離を付ける → ListedRestaurant[]
                           ↓
                    useFilters(...)   検索・タグ・お気に入り・並び替え
                           ↓  results
              ┌────────────┴────────────┐
          Sidebar                    MapView
        （カード一覧）              （丸写真ピン）
              └──────── selectedId ───────┘
                           ↓
                      DetailPanel（PhotoGallery）
```

- **`selectedId` は state を持たず URL がそのまま持つ**（`useMatch('/r/:id')`）。
  だから共有リンクで同じ画面がそのまま開く。カードもピンも `navigate()` を呼ぶだけ。
- **地図はルート切替でアンマウントしない**。詳細パネルの表示が変わるだけなので、
  共有リンクから開いても地図の初期化コストは1回で済む。
- `hoveredId` だけは URL に載せない一時的な state（App が持つ）。

## 表示モード

画面は**地図モード**と**グリッドモード**の2つ。`ViewToggle` で切り替える。

| | 地図モード | グリッドモード |
| --- | --- | --- |
| 主役 | 全画面の地図 | 敷き詰めたカード（`RestaurantGrid`） |
| 絞り込み | `Sidebar` の中に縦積み | 画面上部の帯に横並び |
| 地図 | 画面いっぱい | グリッドの1タイル（`mapSlot`） |
| モバイル | ボトムシートにリスト | シートは出さず画面全部がグリッド |

- **モードは `localStorage`（`osaka-view-v1`）が持ち、URL には載せない**。
  URL が指すのは「どの店を見ているか」だけにしておきたい。
  だから共有リンクを受け取った人は、その人がいつも使っているモードのまま詳細を開く。
- **絞り込みは `FilterBar` として両モードで共通**。`layout`（`'column'` / `'row'`）で
  並べ方だけ変える。状態は `useFilters` が持つので、モードを切り替えても検索語もタグも残る。
- **狭い画面では `FilterBar` は検索欄だけを出す**。タグ・並び順・お気に入りは
  漏斗ボタンの中に畳み、押したときだけ下に開く（`aria-expanded` / `aria-controls`）。
  閉じていても効いていることが分かるよう、ボタンに条件の数をバッジで出す。
  帯が縦を食うと一覧やグリッドがそのぶん押し出されて、肝心の結果が見えなくなるため。
- **件数と `ViewToggle` は `FilterBar` ではなく一覧の直前**（`ResultCount` の行）に置く。
  数えている対象のすぐ上にあるほうが結び付きが分かりやすく、
  狭い画面で検索欄の幅を削らずに済む。
- **モードを切り替えると地図は作り直される**。グリッドモードでは `MapView` が
  `RestaurantGrid` の `mapSlot` に入り、DOM 上の親が変わる = React には別ツリーに見えるため、
  アンマウント → 再マウントになる。切替はユーザーが明示的に押したときだけの操作なので、
  この初期化コストは受け入れている。地図を生かしたまま移そうとすると、
  両モードのレイアウトを地図の都合に合わせて縛ることになり、割に合わない。
- グリッドの小窓は 320×240 程度しかないので、`MapView` に `compact` を渡して
  `fitBounds` / `flyTo` の余白の基準値を 60px から 24px へ落とす。全画面の値のままだと寄りすぎる。
- **`DetailPanel` と「見つかりません」パネルはモード分岐の外**に置く。
  共有リンクの直開き・Esc で閉じる・共有ボタンの振る舞いを、モードで変えないため。

## レイヤの役割

### `lib/` — 純関数だけ

React も DOM も知らない。ここに置いたものは全部テストがある。

| ファイル | 中身 |
| --- | --- |
| `normalize.ts` | NFKC → カタカナをひらがなへ → 小文字化。検索のゆれ吸収 |
| `distance.ts` | haversine と `950m` / `4.1km` / `徒歩12分` の整形 |
| `tagColor.ts` | タグ文字列のハッシュ → パレット。背景の輝度から文字色も決める |
| `filter.ts` | `(list, criteria) => list` の絞り込みと並び替え |
| `assetUrl.ts` | `public/` 配下のパスに `BASE_URL` を前置する |

### `hooks/` — 状態と副作用

| フック | 役割 |
| --- | --- |
| `useRestaurants` | データ読み込み + 現在地からの距離付与 |
| `useFilters` | 検索語・タグ・並び順・お気に入りのみ。結果とチップの件数を返す |
| `useFavorites` | `localStorage`（`osaka-fav-v1`）と同期。`storage` イベントで別タブとも |
| `useGeolocation` | 位置情報。**呼ばれたときだけ**許可を求める |
| `useViewMode` | 表示モード。`localStorage`（`osaka-view-v1`）と同期。別タブとも揃う |
| `useMediaQuery` | 900px でサイドバー ⇄ ボトムシートを切り替える |
| `useMapLibre` | 地図インスタンスの生成・スタイルの色味調整・破棄 |

### `components/` — 見た目

各フォルダに `.tsx` と `.module.css`。**生の16進数は書かず**、
必ず `src/index.css` の `:root` にあるトークン（`var(--pink)` など）を参照する。
デザインを変えたいときは、まず `index.css` の `:root` を触る。

## 意識的にそうしている点

- **絞り込みは AND**（検索語のトークン同士も、選択タグ同士も）。
  絞り込みが目的なので、0件になる組み合わせは事前にチップを薄くして見せる。
- **位置情報は「近い順」を押した瞬間だけ求める**。
  読み込み時に許可ダイアログを出さない。拒否されたら黙っておすすめ順へ戻す。
- **地図は maplibre-gl を遅延読み込み**（`React.lazy`）。
  gzip で 270kB あるので、リストと検索を先に見せる。初期JSは 85kB 程度に収まる。
- **マーカーはクラスタリングしない**。店数が少ないうちは要らない。
  30軒を超えて難波・道頓堀の重なりが辛くなったら入れる。

## テスト

```bash
npm test            # ウォッチ
npm test -- --run   # 1回だけ
```

- `lib/` と `data/` は純ロジックとして単体テスト。
- `Sidebar.test.tsx` は App と同じつなぎ方でフックを動かし、**地図なしで**
  検索・タグ・お気に入りの振る舞いを確認する。
- `App.test.tsx` は `MapView` をダミーに差し替え（jsdom に WebGL が無いため）、
  共有リンクの直開き・Esc で閉じる・位置情報の要求タイミングを見る。
- 地図の実描画とピンの位置は jsdom では確認できない。
  変更したら**実ブラウザで目視すること**。

## デプロイ

`main` へ push すると `.github/workflows/deploy.yml` が
テスト → ビルド → GitHub Pages へ配信する。

- `VITE_BASE` にリポジトリ名を自動で渡すので、**リポジトリ名を変えても動く**。
- ローカルの `npm run dev` / `npm run preview` の base は
  `vite.config.ts` の既定値（`/osaka-restaurant/`）。
