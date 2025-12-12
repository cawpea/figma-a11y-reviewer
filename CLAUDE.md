# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

> **📚 詳細なドキュメント**: このファイルはクイックリファレンスです。より詳細な情報は[`docs/`ディレクトリ](docs/README.md)を参照してください。

## プロジェクト概要

Figma A11y Reviewerは、FigmaデザインのアクセシビリティをAnthropicのClaude
APIを使ってAI評価するシステムです。Figmaプラグイン（Preact +
TailwindCSS）とバックエンドAPI（Express.js）で構成されています。

**評価項目**: WCAG 2.2 Level A/AA/AAA準拠

- Level
  A: 色の使用、情報構造、ラベル、リンクの目的など（**コントラスト比は含まない**）
- Level AA: Level A + **色のコントラスト（4.5:1 /
  3:1）**、タッチターゲットサイズなど
- Level AAA: Level AA + **強化コントラスト（7:1 /
  4.5:1）**、視覚的プレゼンテーション（行間・テキスト幅）、テキスト画像の完全除外、強化ターゲットサイズ（44x44px）、リンク目的の厳格化、ナビゲーション構造、フォーカス可視性強化など

**詳細**: [docs/architecture/overview.md](docs/architecture/overview.md)

## クイックスタート

### 初回セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd figma-ui-reviewer

# バックエンドのセットアップ
cd backend
npm install
cp .env.example .env  # オプション: 環境変数を設定（PORTなど）

# Figmaプラグインのセットアップ
cd ../figma-plugin
npm install
cp .env.development.example .env.development  # 開発用環境変数を設定
npm run build:dev  # 開発環境用ビルド
```

**API Keyの設定**:
Claude API
Keyは環境変数ではなく、Figmaプラグインの初回起動時にUIから設定します。

**詳細**:
[docs/development/getting-started.md](docs/development/getting-started.md)

### Figmaでの確認

1. Figma Desktopアプリを開く
2. Plugins > Development > Import plugin from manifest...
3. `figma-plugin/manifest.json`を選択
4. フレームを選択してプラグインを実行

## 主要コマンド

**詳細**: [docs/development/commands.md](docs/development/commands.md)

### バックエンド

```bash
cd backend
npm run dev          # 開発サーバー起動（ホットリロード）
npm run build:dev    # 開発環境用ビルド
npm test             # テスト実行
```

### Figmaプラグイン

```bash
cd figma-plugin
npm run watch        # 開発時の推奨（CSS + JS並行ウォッチ、開発環境設定を使用）
npm run build:dev    # 開発環境用ビルド
npm run build:prod   # 本番環境用ビルド
npm test             # テスト実行
```

### ルートディレクトリ

```bash
npm run validate:docs        # ドキュメント検証（コード参照 + 更新確認）
npm run validate:docs:code   # コード参照（CODE_REF）の検証のみ
npm run validate:docs:update # ドキュメント更新確認のみ
```

## アーキテクチャ概要

### ディレクトリ構造

```
figma-plugin/          # Figmaプラグイン（Preact + TailwindCSS）
backend/               # バックエンドAPI（Express.js）
shared/                # 共有型定義
docs/                  # ドキュメント
scripts/               # ユーティリティスクリプト
```

### データフロー

1. **Figmaプラグイン**: ユーザーがフレームを選択 → ノードデータ抽出 + スクリーンショットキャプチャ
2. **バックエンド**: `POST /api/evaluate`
   → 各評価エージェント並列実行（スクリーンショット含む）
3. **Claude API**: エージェントごとに評価を実行（Vision API対応、temperature=0）
4. **レスポンス**: 評価結果（スコア、問題点、提案）を返却

**詳細**:
[docs/architecture/overview.md](docs/architecture/overview.md#データフロー)

### 評価エージェントシステム

現在のシステムは**アクセシビリティ評価専用**です。

**利用可能なエージェント**:

- `AccessibilityAAgent`: WCAG 2.2 Level
  A、情報や機能に到達するための最低限の基準
  - 評価項目: 色の使用（1.4.1）、情報構造（1.3.1,
    1.3.2）、ラベル（3.3.2）、リンクの目的（2.4.4）など
  - **注意**: Level Aには色のコントラスト比の要件は含まれません
- `AccessibilityAAAgent`: WCAG 2.2 Level
  AA、より多くの人が問題なく使えることを目的とした実用的な基準
  - 評価項目: Level
    A + 色のコントラスト（通常4.5:1、大きなテキスト3:1）、タッチターゲットサイズなど
- `AccessibilityAAAAgent`: WCAG 2.2 Level
  AAA、さまざまな障害のある人に対して最大限の配慮を行う最高レベルの基準
  - 評価項目: Level A + Level AA + **AAA固有基準**（全65基準を網羅）
  - **AAA固有の主要基準**: 強化コントラスト（通常7:1、大きなテキスト4.5:1）（1.4.6）、視覚的プレゼンテーション（行間1.5倍以上、テキスト幅最大80文字、均等割付回避）（1.4.8）、テキスト画像の完全除外（1.4.9）、強化ターゲットサイズ44x44px（2.5.5）、リンク目的の厳格化（リンクテキスト単独で理解可能）（2.4.9）、ナビゲーション構造（現在位置表示、セクション見出し）（2.4.8,
    2.4.10）、フォーカス可視性強化（2.4.12,
    2.4.13）、コンテキスト依存のヘルプ（3.3.5）、エラー防止（全送信）（3.3.6）など
  - **注意**:
    AAA基準を満たすには、A・AA・AAAすべての基準を満たす必要があります（階層的評価）

**WCAG基準選択**:

Figma
Pluginでは、評価前にラジオボタンでWCAG基準（A/AA/AAA）を選択できます。選択された基準に応じて、対応するエージェントが自動的に実行されます。デフォルトはAA基準です。

各エージェントは`BaseEvaluationAgent`を継承し、以下を実装します：

- `systemPrompt`: 評価基準とJSON出力フォーマット
- `buildPrompt()`: ノードデータから評価用プロンプト生成
- `callClaude()`: Claude API呼び出し（Vision API対応）
- `parseResponse()`: レスポンスのパースと構造化
- `setScreenshot()`: スクリーンショットの設定（オプション）

**新規エージェント追加**: [docs/guides/](docs/guides/)を参照

## 開発時の重要ポイント

### 技術スタック

- **フロントエンド**: Preact (3KB), TailwindCSS, Create Figma Plugin
- **バックエンド**: Express.js, TypeScript, Zod
- **AI**: Claude API (`claude-sonnet-4-20250514`)
- **テスト**: Jest, Testing Library

**詳細**: [docs/reference/tech-stack.md](docs/reference/)

### デバッグ

開発環境（`NODE_ENV=development`）では`backend/logs/`にデバッグ情報が保存されます：

- `debug-*.json`: Figmaから受信したノードデータ
- `prompts/prompt-*.json`: Claude APIリクエスト/レスポンス
- `screenshots/screenshot-*.png`: スクリーンショット画像（Vision API用）

古いログは7日後に自動削除されます。

**詳細**: [docs/development/debugging.md](docs/development/)

### コンポーネント追加

1. `figma-plugin/src/components/`に新しいディレクトリを作成
2. `index.tsx`でコンポーネントを実装（TailwindCSS使用）
3. 必要に応じて`hooks/`にカスタムフックを作成

**詳細**: [docs/figma-plugin/components.md](docs/figma-plugin/)

### 機能トグル

開発環境では右下のフローティングボタンから機能トグル設定にアクセスできます。

**利用可能な機能:**

- **モックAPI使用**
  (`MOCK_API`): バックエンドAPIなしでモックデータを使用してUI開発・テスト可能

**使い方:**

```typescript
import { useFeatureFlags } from './contexts/FeatureFlagContext/useFeatureFlags';
import { FeatureFlag } from './constants/featureFlags';

const { isEnabled } = useFeatureFlags();
if (isEnabled(FeatureFlag.MOCK_API)) {
  // モックAPIを使用
}
```

**詳細**:
[docs/figma-plugin/feature-toggles.md](docs/figma-plugin/feature-toggles.md)

### エージェント追加

**注意**: 現在のシステムはアクセシビリティ評価専用です。新しいエージェントを追加する場合：

1. `backend/src/services/agents/`に新しいエージェントクラスを作成
2. `BaseEvaluationAgent`を継承して実装
3. `evaluation.service.ts`の`agents`オブジェクトに追加
4. `figma-plugin/src/constants/agents.ts`の`agentOptions`に追加

**詳細**: [docs/guides/](docs/guides/)

## テスト

### テスト実行

```bash
# バックエンド
cd backend
npm test                  # 全テスト実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジレポート

# Figmaプラグイン
cd figma-plugin
npm test                  # 全テスト実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジレポート
```

### テスト方針

- **命名**: 日本語で記述（例:
  `describe('Badge', () => { it('高重要度バッジをレンダリングする', ...`）
- **カバレッジ目標**: 新規コード80%以上
- **ユーザー視点**: アクセシビリティクエリ（`getByRole`, `getByText`）を優先

**詳細**: [docs/development/testing-guide.md](docs/development/testing-guide.md)

## 環境変数

### バックエンド（backend/.env）

```bash
# オプション（開発環境用）
PORT=3000                    # デフォルト: 3000
NODE_ENV=development         # 本番では production
CORS_ORIGIN=*               # 本番では適切なオリジンを設定
```

**注意**: Claude API
Keyは環境変数ではなく、**ユーザーがFigmaプラグインのUIで設定**します。API
Keyは各ユーザーのデバイスに`figma.clientStorage`としてローカル保存され、評価リクエスト時にバックエンドに送信されます。

### Figmaプラグイン（figma-plugin/.env.{development|production}）

```bash
# API Base URL
API_BASE_URL=http://localhost:3000/api  # 開発環境
# API_BASE_URL=https://your-api.com/api  # 本番環境
```

**重要**:
Figmaプラグインの環境変数はビルド時にコードに埋め込まれます。変更後は必ず`npm run build:dev`または`npm run build:prod`で再ビルドしてください。

### API Keyの設定方法

1. Figmaプラグインを開く
2. 「API Key (Claude)」フィールドにAPI Keyを入力（`sk-ant-api03-`で始まる）
3. API Keyは[Anthropic
   Console](https://console.anthropic.com/settings/keys)から取得可能
4. 入力されたAPI Keyはデバイスにローカル保存され、評価時にバックエンドに送信されます

## ドキュメント構造

```
docs/
├── README.md                 # LLM向けナビゲーション
├── architecture/             # システムアーキテクチャ
├── backend/                  # バックエンド実装とAPI仕様
│   └── api.md                # REST APIエンドポイント仕様
├── figma-plugin/             # Figmaプラグイン実装
├── development/              # 開発ガイド
└── shared/                   # 共有型定義
```

**ドキュメント検索**: 質問タイプ別の検索マップは[docs/README.md](docs/README.md)を参照
