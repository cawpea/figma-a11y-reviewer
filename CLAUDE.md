# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Figma UI Reviewerは、FigmaデザインをAnthropicのClaude APIを使ってAIによる自動評価を行うシステムです。Figmaプラグインとバックエンド APIで構成されています。

## アーキテクチャ

### システム構成

```
figma-plugin/          # Figmaプラグイン（TypeScript）
├── src/code.ts       # メインロジック（Figma API連携）
├── src/ui.html       # プラグインUI
└── manifest.json     # プラグイン設定

backend/              # Express.js バックエンド API
├── src/
│   ├── index.ts                     # サーバーエントリーポイント
│   ├── routes/evaluation.ts         # 評価APIエンドポイント
│   ├── services/
│   │   ├── evaluation.service.ts    # 評価ロジックのオーケストレーション
│   │   └── agents/
│   │       ├── base.agent.ts        # 評価エージェントの基底クラス
│   │       ├── accessibility.agent.ts    # アクセシビリティ評価
│   │       └── design-system.agent.ts    # デザインシステム評価
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
   - `figma-plugin/src/code.ts`の`extractNodeData()`が選択されたノードの情報を再帰的に抽出
   - 抽出されたノードデータを`POST /api/evaluate`に送信

2. **バックエンド → Claude API**
   - `backend/src/services/evaluation.service.ts`が各評価エージェント（accessibility, designSystem）を並列実行
   - 各エージェント（`base.agent.ts`を継承）がClaude APIを呼び出し
   - システムプロンプトとノードデータを使って評価を実行

3. **レスポンス → Figmaプラグイン**
   - 評価結果（スコア、問題点、提案）をJSON形式で返却
   - プラグインUIに結果を表示

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
# ビルド（TypeScriptコンパイル + HTMLコピー）
cd figma-plugin
npm run build

# 開発時は watch モード推奨
npm run watch
```

**Figmaでの確認手順**:
1. Figma Desktopアプリを開く
2. Plugins > Development > Import plugin from manifest...
3. `figma-plugin/manifest.json`を選択
4. フレームを選択してプラグインを実行

## 開発時の重要ポイント

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

### Figmaノードデータの抽出

`figma-plugin/src/code.ts`の`extractNodeData()`は最大深度10まで再帰的にノード情報を取得します。以下の情報を抽出：

- レイアウト（Auto Layout）: `layoutMode`, `padding`, `itemSpacing`など
- スタイル: `fills`, `strokes`, `effects`, `cornerRadius`
- テキスト: `characters`, `fontSize`, `fontName`, `lineHeight`
- サイズと位置: `absoluteBoundingBox`
- 子要素: `children`配列（再帰）

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
    designSystem: { ... }
  },
  suggestions: Suggestion[],      // 重要度順にソート済み
  metadata: {
    evaluatedAt: Date,
    duration: number              // 評価にかかった時間（ms）
  }
}
```

### エラーハンドリング

- バリデーション: `zod`スキーマで入力を検証（`backend/src/routes/evaluation.ts`）
- 評価エラー: 個別エージェントでエラーが発生してもスコア0で結果を返す
- ミドルウェア: `backend/src/middleware/error-handler.ts`で共通エラーハンドリング

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
