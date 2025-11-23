# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## プロジェクト概要

Figma UI Reviewerは、FigmaデザインをAnthropicのClaude
APIを使ってAIによる自動評価を行うシステムです。Figmaプラグインとバックエンド APIで構成されています。

## アーキテクチャ

### システム構成

```
figma-plugin/          # Figmaプラグイン(Preact + TailwindCSS)
├── src/
│   ├── main.ts       # メインロジック(Figma API連携)
│   ├── ui.tsx        # プラグインUI(Preact)
│   ├── types.ts      # 型定義
│   ├── input.css     # TailwindCSS入力
│   ├── output.css    # TailwindCSS出力
│   ├── components/   # UIコンポーネント
│   ├── hooks/        # カスタムフック
│   └── constants/    # 定数
├── manifest.json     # プラグイン設定
├── tailwind.config.js  # TailwindCSS設定
└── package.json

backend/              # Express.js バックエンド API
├── src/
│   ├── index.ts                     # サーバーエントリーポイント
│   ├── routes/evaluation.ts         # 評価APIエンドポイント
│   ├── services/
│   │   ├── evaluation.service.ts    # 評価ロジックのオーケストレーション
│   │   └── agents/
│   │       ├── base.agent.ts        # 評価エージェントの基底クラス
│   │       ├── accessibility.agent.ts    # アクセシビリティ評価
│   │       └── style-consistency.agent.ts    # スタイルの一貫性評価
│   ├── config/anthropic.ts          # Claude API設定
│   ├── types/index.ts               # 型定義
│   └── utils/
│       ├── debug.ts                 # デバッグログ管理
│       └── prompt.utils.ts          # プロンプト生成ユーティリティ
└── .env                             # 環境変数（ANTHROPIC_API_KEY）
```

### データフロー

1. **Figmaプラグイン → バックエンド**
   - ユーザーがFigmaでフレームを選択してプラグインを実行
   - `figma-plugin/src/main.ts`の`extractNodeData()`が選択されたノードの情報を再帰的に抽出
   - `useEvaluation`フックが選択されたエージェントと共に抽出データを`POST /api/evaluate`に送信

2. **バックエンド → Claude API**
   - `backend/src/services/evaluation.service.ts`が各評価エージェント(accessibility,
     styleConsistency, usability)を並列実行
   - 各エージェント(`base.agent.ts`を継承)がClaude APIを呼び出し
   - システムプロンプトとノードデータを使って評価を実行

3. **レスポンス → Figmaプラグイン**
   - 評価結果(スコア、問題点、提案)をJSON形式で返却
   - `ResultView`コンポーネントが結果を整形して表示
   - カテゴリごとに`CategorySection`でスコア、問題点、ポジティブ項目を表示

### 評価エージェントシステム

各評価エージェントは`BaseEvaluationAgent`を継承しており、以下の責務を持ちます：

- `systemPrompt`: 評価基準とJSON出力フォーマットの定義
- `buildPrompt()`: Figmaノードデータから評価用プロンプトを生成
- `callClaude()`: Claude APIを呼び出し（temperature=0で一貫性を保証）
- `parseResponse()`: Claude APIのレスポンスをパースして構造化

新しい評価軸を追加する場合は、`BaseEvaluationAgent`を継承したクラスを作成し、`evaluation.service.ts`の`agents`オブジェクトに追加してください。

## 開発コマンド

### バックエンドAPI

```bash
# 開発サーバー起動（ホットリロード有効）
cd backend
npm run dev

# 型チェック
npm run type-check

# ビルド
npm run build

# 本番環境起動
npm start
```

**重要**: `backend/.env`ファイルに`ANTHROPIC_API_KEY`を設定する必要があります。

### Figmaプラグイン

```bash
cd figma-plugin

# ビルド(TailwindCSS + TypeScriptコンパイル)
npm run build

# 開発時は watch モード推奨(CSS + JSを並行ウォッチ)
npm run watch

# TailwindCSSのみビルド
npm run build:css

# TypeScriptのみビルド
npm run build:js

# 型チェック
npm run type-check
```

**Figmaでの確認手順**:

1. Figma Desktopアプリを開く
2. Plugins > Development > Import plugin from manifest...
3. `figma-plugin/manifest.json`を選択
4. フレームを選択してプラグインを実行

**技術スタック**:

- **Preact**: 軽量なReact代替ライブラリ (3KB)
- **TailwindCSS**: ユーティリティファーストのCSSフレームワーク
- **Create Figma Plugin**: Figmaプラグイン開発フレームワーク
- **TypeScript**: 型安全性の確保

## 開発時の重要ポイント

### Figmaプラグインの開発

#### コンポーネント追加時の手順

1. `figma-plugin/src/components/`に新しいコンポーネントディレクトリを作成
2. `index.tsx`でコンポーネントを実装
3. TailwindCSSのユーティリティクラスでスタイリング
4. 必要に応じてカスタムフックを`hooks/`に作成

#### ビルドシステム

- **TailwindCSS**: `input.css` → `output.css`への変換
- **TypeScript**: `src/main.ts`と`src/ui.tsx`をコンパイル
- **Create Figma Plugin**: `manifest.json`の生成と`build/`ディレクトリへの出力
- **Watch モード**: `concurrently`でCSS/JSの同時ウォッチ

#### スタイリングのベストプラクティス

- TailwindCSSのユーティリティクラスを優先的に使用
- カスタムCSSが必要な場合は`input.css`に追加
- レスポンシブデザインは不要(Figmaプラグインは固定サイズ)
- Figmaのデザインガイドラインに従った色・タイポグラフィを使用

### デバッグログ

開発環境（`NODE_ENV=development`）では以下のデバッグ情報が`backend/logs/`に保存されます：

- `debug-*.json`: Figmaから受信したノードデータ
- `prompts/prompt-*.json`: Claude APIに送信したプロンプトとレスポンス

古いログは7日後に自動削除されます（`cleanupOldDebugFiles()`）。

### Claude API設定

`backend/src/config/anthropic.ts`:

- モデル: `claude-sonnet-4-20250514`
- `temperature: 0`: 評価の一貫性を確保するため
- `maxTokens: 4000`: 長い評価結果に対応

### Figmaプラグインのアーキテクチャ

#### UIコンポーネント構造

プラグインUIは**Preact**と**TailwindCSS**を使用して構築されており、以下のコンポーネント階層を持ちます:

```
Plugin (src/components/Plugin/index.tsx)
├── Header                    # プラグインヘッダー
├── ControlPanel              # 評価開始コントロール
│   ├── Button                # 評価開始ボタン
│   ├── TimeEstimate          # 推定時間表示
│   └── SettingsPopover       # 設定ポップオーバー
│       └── AgentOptionItem   # エージェント選択項目
│           └── Checkbox      # チェックボックス
├── LoadingSpinner            # 評価中の表示
│   └── Spinner               # スピナーアニメーション
├── ErrorDisplay              # エラー表示
└── ResultView                # 評価結果表示
    ├── ScoreCard             # 総合スコア
    └── CategorySection[]     # カテゴリ別結果
        ├── Badge             # カテゴリバッジ
        ├── IssueItem[]       # 問題項目リスト
        └── PositiveItem[]    # ポジティブ項目リスト
```

#### カスタムフック

- **useEvaluation** (`src/components/Plugin/hooks/useEvaluation.ts`)
  - 評価処理の状態管理
  - バックエンドAPIとの通信
  - ローディング・エラー・結果の状態管理

- **useAgentSelection** (`src/components/Plugin/hooks/useAgentSelection.ts`)
  - 評価エージェントの選択状態管理
  - 選択されたエージェントの保存・読み込み
  - 推定時間の計算

- **useOutsideClick** (`src/hooks/useOutsideClick.ts`)
  - 要素外クリックの検出
  - ポップオーバーなどの閉じる処理

#### エージェント定義

`src/constants/agents.ts`でサポートされる評価エージェントを定義:

- **accessibility**: アクセシビリティ評価 (推定15秒)
- **styleConsistency**: スタイルの一貫性評価 (推定18秒)
- **usability**: ユーザビリティ評価 (推定20秒)

### Figmaノードデータの抽出

`figma-plugin/src/main.ts`の`extractNodeData()`は最大深度10まで再帰的にノード情報を取得します。以下の情報を抽出:

- レイアウト(Auto Layout): `layoutMode`, `padding`, `itemSpacing`など
- スタイル: `fills`, `strokes`, `effects`, `cornerRadius`
- テキスト: `characters`, `fontSize`, `fontName`, `lineHeight`
- サイズと位置: `absoluteBoundingBox`
- 子要素: `children`配列(再帰)

### 評価結果の構造

```typescript
{
  overallScore: number,           // 総合スコア（0-100）
  categories: {
    accessibility: {
      score: number,
      issues: Issue[],
      positives?: string[]
    },
    styleConsistency: { ... }
  },
  suggestions: Suggestion[],      // 重要度順にソート済み
  metadata: {
    evaluatedAt: Date,
    duration: number              // 評価にかかった時間（ms）
  }
}
```

### エラーハンドリング

- バリデーション:
  `zod`スキーマで入力を検証（`backend/src/routes/evaluation.ts`）
- 評価エラー: 個別エージェントでエラーが発生してもスコア0で結果を返す
- ミドルウェア:
  `backend/src/middleware/error-handler.ts`で共通エラーハンドリング

## テストとデプロイ

### ローカルテスト

1. バックエンドを起動: `cd backend && npm run dev`
2. APIヘルスチェック: `curl http://localhost:3000/api/health`
3. Figmaプラグインをビルド: `cd figma-plugin && npm run build`
4. Figmaでプラグインを実行してエンドツーエンドテスト

### 環境変数

```bash
# 必須
ANTHROPIC_API_KEY=***

# オプション
PORT=3000                    # デフォルト: 3000
NODE_ENV=development         # 本番では production
CORS_ORIGIN=*               # 本番では適切なオリジンを設定
```

## テスト方針

### テストフレームワーク

- **Jest**: ユニットテスト・統合テストフレームワーク
- **Testing Library**: コンポーネントテスト用（Preact対応）
- **@testing-library/user-event**: ユーザーインタラクションのシミュレーション

### テストコマンド

```bash
# バックエンドのテスト
cd backend
npm test                  # 全テスト実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジレポート生成

# Figmaプラグインのテスト
cd figma-plugin
npm test                  # 全テスト実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジレポート生成
```

### テストの命名規則

- **describe**: 日本語でテスト対象を記述（例: `describe('Badge', () => ...)`）
- **it**: 日本語で期待する動作を記述（例:
  `it('高重要度バッジをレンダリングする', () => ...)`）
- テストケースは動詞で始める（「〜する」「〜される」）

### バックエンドのテスト構造

```
backend/src/
├── services/
│   ├── evaluation.service.test.ts       # 評価サービス全体のテスト
│   └── agents/
│       ├── accessibility.agent.test.ts  # アクセシビリティエージェントのテスト
│       └── base.agent.test.ts           # 基底エージェントクラスのテスト
└── utils/
    └── prompt.utils.test.ts             # プロンプトユーティリティのテスト
```

**テスト観点**:

- 評価ロジックの正確性
- Claude APIレスポンスのパース処理
- エラーハンドリング
- ノードID検証（Figmaの正規ID形式のバリデーション）
- カラーコントラスト計算

### Figmaプラグインのテスト構造

```
figma-plugin/src/
├── components/
│   ├── Badge/index.test.tsx             # バッジコンポーネント
│   ├── Button/index.test.tsx            # ボタンコンポーネント
│   ├── Checkbox/index.test.tsx          # チェックボックスコンポーネント
│   ├── ResultView/index.test.tsx        # 結果表示コンポーネント
│   ├── SettingsPopover/index.test.tsx   # 設定ポップオーバー
│   └── Plugin/hooks/
│       ├── useEvaluation.test.ts        # 評価フック
│       └── useAgentSelection.test.ts    # エージェント選択フック
```

**テスト観点**:

- UIコンポーネントの正しいレンダリング
- ユーザーインタラクション（クリック、入力）の動作
- 状態管理の正確性
- イベントハンドラーの呼び出し確認
- LocalStorageとの連携

### テストのベストプラクティス

1. **ユーザー視点でテストする**
   - `getByRole`, `getByText`などのアクセシビリティクエリを優先
   - 実装の詳細ではなく、ユーザーの視点で検証

2. **モック戦略**
   - 外部依存（API、localStorage）は適切にモック化
   - `@create-figma-plugin/utilities`のイベントシステムをモック

3. **カバレッジ目標**
   - 新規コードは80%以上のカバレッジを目指す
   - クリティカルパス（評価ロジック、データパース）は100%

4. **テストの独立性**
   - 各テストは独立して実行可能
   - `beforeEach`で状態をクリーンアップ
   - モックは各テストでリセット

5. **非同期処理のテスト**
   - `async/await`と`waitFor`を使用
   - タイムアウトは適切に設定

### CI/CD統合

- Pull Request作成時に自動テスト実行
- カバレッジレポートの自動生成
- テスト失敗時はマージをブロック
