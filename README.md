# 大阪めしMAP

自分が紹介したい大阪のお店を、地図とタグで見せる静的サイト。
バックエンドなし。データは `src/data/restaurants.json` の1枚だけ。

**Vite + React + TypeScript** / **MapLibre GL JS + OpenFreeMap**（APIキー不要）/
**GitHub Pages** に push だけでデプロイ。

## 開発

```bash
npm install
npm run dev        # http://localhost:5173/osaka-restaurant/
npm test           # Vitest（ウォッチ）
npm test -- --run  # 1回だけ実行
npm run build      # 型チェック + 本番ビルド
npm run preview    # 本番ビルドをローカル確認（base 付き）
```

> `npm run dev` の URL に `/osaka-restaurant/` が付くのは、
> GitHub Pages と同じ base パスで動かしているため。

## ドキュメント

| | |
| --- | --- |
| [docs/data.md](docs/data.md) | お店の追加・編集。`restaurants.json` の全フィールドと id の決まり |
| [docs/photos.md](docs/photos.md) | 写真の入れ方。`src/photos/<店id>/` に置くだけで複数枚ギャラリーになる |
| [docs/architecture.md](docs/architecture.md) | 構成とデータの流れ、なぜそうしたか |
| [docs/gotchas.md](docs/gotchas.md) | **踏んだ罠**。maplibre は v5 固定・ピンのCSSの落とし穴など |

## お店を1軒足す

1. `src/data/restaurants.json` に1件足す → [docs/data.md](docs/data.md)
2. 写真を `src/photos/<店id>/` に放り込む → [docs/photos.md](docs/photos.md)
3. `git push`（`main` への push でテスト → ビルド → 公開まで自動）

## デプロイ（初回だけ）

```bash
git init && git add -A && git commit -m "初回コミット"
git branch -M main
gh repo create osaka-restaurant --public --source=. --push
```

そのあと GitHub の **Settings → Pages → Source を「GitHub Actions」** に設定する。
公開 URL は `https://<ユーザー名>.github.io/osaka-restaurant/`。

リポジトリ名を変えてもワークフローが `VITE_BASE` に自動で渡すのでそのまま動く。
ローカルの base を合わせたいときは `vite.config.ts` の既定値を書き換える。
