# Goal Task Idea

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-alpha-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?logo=pnpm&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)

![GitHub last commit](https://img.shields.io/github/last-commit/poko8nada/goal-task-idea)
![GitHub issues](https://img.shields.io/github/issues/poko8nada/goal-task-idea)

## Overview

目標とタスクを、自由なキャンバス上でガントチャート風に並べて可視化するアプリ。Goal（依存関係で左→右に並ぶ）、Task（Goal 内部で縦に並ぶ）、Note（キャンバスに浮く）の 3 種を扱う。データは単純な JSON なので、AI エージェントが直接読み込んで壁打ち相手になる運用を想定している。

個人目標（キャリア / 学習 / 習慣）からチーム / 企業の目標管理まで、依存関係で道なりを可視化したい場面を中核ユースケースとする。v1 はローカル PC 動作が前提で、Cloudflare Workers へのデプロイは v2 以降で検討する。

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 以上（22 推奨）
- [pnpm](https://pnpm.io/) 11.x（`package.json` の `packageManager` で固定）

### Install

```bash
pnpm install
```

依存導入時に Lefthook が pre-commit / pre-push フックを設定する。

### Run

```bash
pnpm dev
```

`http://localhost:5173` を開くと `app/data/data.json` のサンプル Goal / Task / Note がキャンバスに表示される。

## Usage

| コマンド                            | 用途                                     |
| ----------------------------------- | ---------------------------------------- |
| `pnpm dev`                          | Vite 開発サーバー                        |
| `pnpm dev:remote`                   | `rebuild` のあと `wrangler dev --remote` |
| `pnpm build`                        | クライアント → Workers 二段ビルド        |
| `pnpm deploy`                       | ビルド後に `wrangler deploy`             |
| `pnpm preview`                      | `wrangler dev`（ローカル Workers）       |
| `pnpm test` / `pnpm test:run`       | Vitest（watch / 一回）                   |
| `pnpm lint` / `pnpm lint:fix`       | oxlint                                   |
| `pnpm format` / `pnpm format:check` | oxfmt                                    |
| `pnpm typecheck`                    | `tsc --noEmit`                           |

コミット前に Lefthook の `oxfmt` / `oxlint`、プッシュ前に `tsc --noEmit` が走る。

## Concept & Goals

### Goals

- **依存関係ベースの可視化** — Goal 間の `dependsOn` を矢印でつなぎ、プロジェクトの道なりを一目で把握する
- **3 種類の粒度を 1 つのキャンバスで扱う** — Goal（到達地点） / Task（実際の作業） / Note（未整理の思考）
- **AI エージェントと協調できるデータ形式** — 単純な JSON なので、エージェントが直接読み、壁打ち相手になれる
- **依存ゼロなキャンバス** — ズーム / パン / ドラッグ / グリッドスナップを自前実装で持ち、外部ライブラリに縛られない

### Non-goals

- リアルタイム共同編集（v2 以降の検討対象）
- タイムライン（時間軸）ベースの UI — 依存関係ベースの水平フローが中核
- モバイル最適化（v1 は PC 前提）
- 認証・権限管理（v2 で検討）

## Stack

| 領域        | 採用                   | 理由                                   |
| ----------- | ---------------------- | -------------------------------------- |
| HTTP / SSR  | Hono + HonoX           | Workers 向けの軽量、Vite と一体        |
| Build / Dev | Vite 6                 | client / worker の二段ビルド           |
| Edge        | Cloudflare Workers     | `wrangler` で preview / deploy         |
| Styling     | Tailwind CSS 4         | `@tailwindcss/vite` で統合             |
| Quality     | oxlint / oxfmt         | 高速、Lefthook で自動化                |
| Test        | Vitest                 | `--passWithNoTests` で CI しやすい     |
| Canvas      | 自前実装（vanilla JS） | 依存ゼロ、エージェントが読み解きやすい |

## App Architecture

```text
app/
├── client.ts            # クライアントエントリ
├── server.ts            # SSR エントリ
├── style.css            # Tailwind エントリ
├── global.d.ts          # HonoX 型拡張
├── routes/              # ファイルシステムルーティング
│   ├── _renderer.tsx    # HTML シェル
│   └── index.tsx        # キャンバスページ
├── islands/             # クライアントサイドの島
│   └── Canvas.tsx       # キャンバス実装（zoom / pan / drag / snap）
├── components/          # 共有コンポーネント
│   └── StatusPill.tsx   # ステータス表示
├── lib/                 # ドメインロジック・型
│   ├── types.ts         # Item 型定義
│   ├── sample.ts        # サンプルデータ（Canvas の初期値）
│   └── useCanvas.ts     # Canvas 用フック
└── data/
    └── data.json        # v1 で読み込む永続データ
```

設計方針:

- **ルートは薄い** — `routes/index.tsx` は `<Canvas />` を呼ぶだけ
- **状態は `useCanvas()` フックに集約** — scale / pan / items を一箇所で管理
- **描画層を交換可能に** — DOM / SVG / Canvas を将来的に差し替えられるよう抽象化
- **`Storage` インターフェースで永続化を抽象化** — v1 は `FileStorage`（`app/data/data.json`）、v2 は `D1Storage` / `KVStorage` に差し替え

データモデル:

```ts
type ItemType = "goal" | "task" | "note";
type ItemStatus = "todo" | "in_progress" | "done";

interface GoalItem {
  id;
  type: "goal";
  title;
  status;
  deadline?;
  dependsOn: string[];
  position;
}
interface TaskItem {
  id;
  type: "task";
  title;
  status;
  deadline?;
  goalId: string;
  position;
}
interface NoteItem {
  id;
  type: "note";
  title;
  position;
}
```

`app/data/data.json` は `{ version, project, context, items }` のラップ形式（v1 計画中のスキーマ）。

## Roadmap

- **v1（現在）**: ローカル動作。`app/data/data.json` を読み込み、キャンバスに描画。`Storage` 抽象は設計のみ
- **v2（未定）**: Cloudflare デプロイ + ログイン（実装するかもしない）
- **v3（未定）**: AI エージェント内蔵（実装するかもしない）

## Contributing

- コミット前に Lefthook（format / lint）が走る
- プッシュ前に typecheck が走る
- 大きな方針変更は Issue か PR 説明で共有する

## License

[MIT](LICENSE)
