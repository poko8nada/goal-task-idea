# draft

## 概要

ガントチャート風の目標・タスク管理アプリケーション。
横軸に依存関係を置いた水平フローで、プロジェクトや目標への道なりを可視化する。

## アイテムの種類

| タイプ   | 役割                               | 特徴                                                        |
| -------- | ---------------------------------- | ----------------------------------------------------------- |
| **Goal** | マイルストーン。フロー上の到達地点 | フラット(ネストなし)。Taskを保持。Goal同士でdependsOnを持つ |
| **Task** | 原子作業。実際にやること           | Goalの中に縦並びで配置                                      |
| **Note** | 未整理の思考。アイデア、疑問       | キャンバスに浮いている。接続なし。GoalやTaskに変換可能      |

## 可視化

- **Goal**: キャンバス上のノード。Goal同士を矢印で接続（dependsOn）
- **Task**: Goal内に縦に並ぶ
- **Note**: 同じキャンバスに浮いている。接続なし
- **フロー**: Goalが左→右に並び、依存関係を矢印で表現
- **ステータス色**: 完了🟢 / 進行中🔵 / 未着手⚪
- **Nowマーカー**: 現在位置を示す垂直線
- **クリティカルパス**: 未完了Goal中最長ルートをハイライト
- **ズーム**: マウスホイール/ピンチで自由にズーム
- **グリッドスナップ**: ドラッグ時にグリッドに吸い付く

```
[Goal A] ────→ [Goal B] ────→ [Goal C]
   │               │               │
   ├── Task 1      ├── Task 3      ├── Task 5
   └── Task 2      └── Task 4      └── Task 6

                  [Note]        [Note]
                  (浮いている)   (浮いている)
```

## データモデル（JSON）

```json
{
  "version": 1,
  "project": {
    "id": "uuid",
    "name": "プロジェクト名",
    "description": "説明（任意）"
  },
  "context": {
    "profile": "ユーザー情報、企業情報など（AIエージェント用）"
  },
  "items": [
    {
      "id": "uuid",
      "type": "goal",
      "title": "フルスタックエンジニアになる",
      "description": "",
      "status": "todo" | "in_progress" | "done",
      "deadline": "2025-12-31 | null",
      "dependsOn": ["Goal B の id"],
      "position": { "x": 100, "y": 200 }
    },
    {
      "id": "uuid",
      "type": "task",
      "title": "React公式ドキュメントを読む",
      "description": "",
      "status": "todo" | "in_progress" | "done",
      "deadline": null,
      "goalId": "親Goalのid",
      "position": { "x": 120, "y": 250 }
    },
    {
      "id": "uuid",
      "type": "note",
      "title": "Next.jsも調べてみるか",
      "position": { "x": 500, "y": 400 }
    }
  ]
}
```

### フィールド説明

| フィールド  | 対象       | 説明                            |
| ----------- | ---------- | ------------------------------- |
| `type`      | 全て       | "goal" / "task" / "note"        |
| `status`    | Goal, Task | "todo" / "in_progress" / "done" |
| `deadline`  | Goal, Task | 期限（任意）                    |
| `dependsOn` | Goalのみ   | 依存するGoalのid配列            |
| `goalId`    | Taskのみ   | 親Goalのid                      |
| `position`  | 全て       | 画面上の位置 (x, y)             |
| `context`   | 全体       | AIエージェント用のコンテキスト  |

## ユースケース

- 個人の目標管理（キャリア、学習、習慣など）
- チームのプロジェクト管理
- 企業目標（company objectives）の管理
- 個人/企業を明示的に分離はしない。AIエージェントが適切な助言をできるよう、コンテキスト情報をグローバルに持つ

## AIエージェント連携

- v1: ローカルで動作、エージェントがJSONファイルを読んで壁打ち・相談相手になる
- エージェントがより良い助言をするために、ユーザーのプロフィールや企業のパフォーマンス情報などのコンテキストを`context`フィールドに持たせる

## 永続化レイヤー

### テスト用追記

### v1（ローカル）

- 保存場所: `app/data.json`
- 読み書き: サーバーAPI（`GET/POST /api/items`）が`fs`で読み書き
- AIエージェントはファイルを直接読める

### v2（Cloudflareデプロイ + ログイン）

- 保存場所: D1（SQLite）またはKV（Key-Value）
- 読み書き: 同じAPIエンドポイントがD1/KVを操作
- 認証: ログイン機能と連携

### 抽象化方針

Storageインターフェースで実装を交換可能にする：

```ts
// app/lib/storage.ts
export interface Storage {
  getProject(): Promise<Project>;
  getItems(): Promise<Item[]>;
  getContext(): Promise<Context>;
  saveProject(project: Project): Promise<void>;
  saveItems(items: Item[]): Promise<void>;
  saveContext(context: Context): Promise<void>;
}
```

実装:

- v1: `FileStorage`（`fs.readFileSync`/`writeFileSync`）
- v2: `D1Storage` / `KVStorage`（D1バインディング使用）

依存の方向:

- ルート（APIエンドポイント）→ Storageインターフェース
- Storageインターフェース ← FileStorage / D1Storage
- ルートは具体的な実装を知らない

利点:

- v1→v2移行時、ルート層の変更不要
- テスト時にモックStorageに差し替え可能
- 将来的にR2（オブジェクトストレージ）等への移行も容易

### Cloudflare Workers制約（v2事前確認）

- `fs`は使えない（read-onlyバンドル以外）
- ビルド時にJSONを埋め込むか、D1/KV/R2を使う
- v1の`FileStorage`は`@hono/vite-dev-server`（node adapter経由）でのみ動作
- v2ビルド時はStorage実装を切り替える必要がある

## スタック・バージョン計画

- **スタック**: HonoX + Vite + TailwindCSS
- **データ形式**: JSON
- **v1**: ローカル動作（PCのみ）。エージェントがファイルを読んで壁打ち相手になる
- **v2**: ログイン機能を実装しデプロイするかも、しないかも
- **v3**: アプリケーションにエージェントをはじめからパッケージするかも、しないかも

## キャンバス実装方針

### 採用：自前実装（DOM + vanilla JS）

**選定理由：**

- 外部依存ゼロ → バンドルサイズ最小、AIエージェントが読み解きやすい
- HonoX Island Componentとして実装可能（コンポーネントベース）
- v2/v3で必要になったらライブラリへ段階的に移行できる

**実装スタック：**
| 機能 | 実装方法 | コード量 |
|------------------|-------------------------------------------|----------|
| ズーム | 親要素の `transform: scale(s)` | ~10行 |
| パン | 親要素の `transform: translate(x, y)` | ~10行 |
| アイテムドラッグ | `pointerdown`/`move`/`up` イベント | ~30行 |
| グリッドスナップ | `Math.round(x / 20) * 20` | ~5行 |
| 矢印描画 | SVGオーバーレイで `<line>` 描画 | ~20行 |
| Nowマーカー | 固定位置の `<div>` | ~10行 |

**合計: ~85行のvanilla JS + 数十行のJSX**

### HonoX との統合

- **HonoX Island Component**: `hono/jsx/dom` の `useState`/`useEffect`/`useRef` を使用
- クライアントサイドハイドレーション: 2.8KB（hono/jsx/dom、Brotli圧縮）
- 構造:
  ```
  app/
  ├── routes/
  │   └── index.tsx          # サーバーサイドでJSON読み込み
  ├── islands/
  │   └── Canvas.tsx         # クライアントサイドのキャンバスロジック
  ├── client.ts              # エントリーファイル
  └── style.css              # TailwindCSS
  ```

### 将来の拡張性

**方針：** v1は自前実装で固定。ライブラリはv1で必要性が確認された場合にのみ導入する。**入れたらv2/v3でも同じものを拡張する**（ライブラリの二重導入はしない、シンプルさ重視）。

**v1 自前実装でやっておくこと：**

- 状態管理を `useCanvas()` フックに集約（scale, pan, items）
- ドラッグ・スナップのロジックをアイテムコンポーネント内に分離
- 描画層を抽象化（DOM / SVG / Canvas を交換可能にする）

**ライブラリ導入の判断基準：**

- アイテム数が多く自前実装のパフォーマンスが限界に達した
- 矢印のベジエ曲線化など、標準APIでは難しい表現が必要になった
- タッチ/ピンチ操作の最適化が必要になった

**その場合の進め方：**

- v2で1つ導入 → v3で同じものを機能拡張
- 例: v2でD3.js (d3-zoom, d3-drag) を部分導入 → v3で同じD3.jsの機能を拡張

### 調査した代替案

| ライブラリ        | バンドル | 評価                              |
| ----------------- | -------- | --------------------------------- |
| 自前実装          | 0KB      | ◎ 採用                            |
| PannerZoomer      | ~3KB     | △ スター0、メンテナンスリスクあり |
| panzoom (anvaka)  | ~6KB     | ○ 1968スター、実績あり            |
| D3.js (zoom/drag) | ~30KB    | △ v2で導入候補                    |
| Konva.js          | ~150KB   | △ 機能過剰                        |
| Fabric.js         | ~300KB   | ✗ 機能過剰                        |
