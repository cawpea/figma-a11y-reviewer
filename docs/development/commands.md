# 開発コマンドリファレンス

このドキュメントでは、開発中に使用する主要なコマンドを説明します。

## バックエンドAPI

### 開発

```bash
cd backend

# 開発サーバー起動（ホットリロード有効）
npm run dev

# 型チェック
npm run type-check
```

### ビルドと本番環境

```bash
# ビルド
npm run build

# 本番環境起動
npm start
```

### テスト

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

### 重要な設定

- **環境変数**: `backend/.env`に`ANTHROPIC_API_KEY`を設定
- **ポート**: デフォルトは`3000`（`PORT`環境変数で変更可能）
- **ヘルスチェック**: `curl http://localhost:3000/api/health`

## Figmaプラグイン

### 開発

```bash
cd figma-plugin

# 開発時の推奨: CSS + JSを並行ウォッチ
npm run watch

# ビルド（TailwindCSS + TypeScriptコンパイル）
npm run build

# 型チェック
npm run type-check
```

### 個別ビルド

```bash
# TailwindCSSのみビルド
npm run build:css

# TypeScriptのみビルド
npm run build:js
```

### テスト

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

### Figmaでの確認手順

1. Figma Desktopアプリを開く
2. **Plugins** > **Development** > **Import plugin from manifest...**
3. `figma-plugin/manifest.json`を選択
4. フレームを選択してプラグインを実行

## ルートディレクトリコマンド

### ドキュメント検証

```bash
# 全ての検証を実行（コード参照 + 更新確認）
npm run validate:docs

# コード参照（CODE_REF）の検証のみ
npm run validate:docs:code

# ドキュメント更新確認のみ
npm run validate:docs:update

# 詳細表示モード（各コマンドで使用可能）
npm run validate:docs -- --verbose
npm run validate:docs:code -- --verbose
npm run validate:docs:update -- --verbose
```

#### validate:docs:code

ドキュメント内の`CODE_REF`コメントが実際のコードファイルと一致しているかを検証します。

**検証内容**:

- ファイルの存在確認
- 行番号範囲の妥当性チェック
- コード参照の整合性確認

#### validate:docs:update

mainブランチとの差分をチェックし、コード変更時にドキュメントが更新されているか確認します。

**検証内容**:

- `git diff main...HEAD`で変更ファイルを取得
- `.docsignore`で除外パターンをフィルタリング
- `CLAUDE.md`または`docs/`配下の更新を確認
- 警告のみ表示（エラー終了しない）

**除外対象**（`.docsignore`で定義）:

- テストファイル（`*.test.ts`）
- 設定ファイル（`*.config.js`、`tsconfig.json`など）
- ビルド成果物（`dist/`、`build/`、`coverage/`）
- ログファイル（`logs/`、`*.log`）

#### validate:docs

上記2つの検証を統合実行します。開発中の最終チェックに使用してください。

## 技術スタック概要

### フロントエンド（Figmaプラグイン）

- **Preact**: 軽量なReact代替ライブラリ（3KB）
- **TailwindCSS**: ユーティリティファーストのCSSフレームワーク
- **Create Figma Plugin**: Figmaプラグイン開発フレームワーク
- **TypeScript**: 型安全性の確保

### バックエンド

- **Express.js**: Node.jsウェブフレームワーク
- **TypeScript**: 型安全性の確保
- **Zod**: ランタイムスキーマバリデーション
- **Anthropic SDK**: Claude API連携

### テスト

- **Jest**: ユニットテスト・統合テストフレームワーク
- **Testing Library**: コンポーネントテスト用（Preact対応）
- **@testing-library/user-event**: ユーザーインタラクションのシミュレーション

## よくあるタスク

### 新しいUIコンポーネントの追加

```bash
cd figma-plugin
# 1. コンポーネントディレクトリを作成
mkdir -p src/components/MyComponent

# 2. コンポーネントファイルを作成（TailwindCSS使用）
# src/components/MyComponent/index.tsx

# 3. ビルドとウォッチ
npm run watch
```

**詳細**: [components.md](../figma-plugin/)参照

### 新しい評価エージェントの追加

```bash
cd backend
# 1. エージェントクラスを作成
# src/services/agents/my-agent.agent.ts

# 2. BaseEvaluationAgentを継承して実装

# 3. evaluation.service.tsに追加

# 4. テストを作成
# src/services/agents/my-agent.agent.test.ts

# 5. テスト実行
npm test
```

**詳細**: [新規エージェント追加ガイド](../guides/)参照

### API動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# 評価APIのテスト（jqで整形）
curl -X POST http://localhost:3000/api/evaluate \
  -H "Content-Type: application/json" \
  -d @test-data.json | jq
```

**詳細**: [api/endpoints.md](../api/endpoints.md)参照

## トラブルシューティング

### バックエンドが起動しない

```bash
# 環境変数の確認
cat backend/.env | grep ANTHROPIC_API_KEY

# ポート競合の確認
lsof -i :3000

# 依存関係の再インストール
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Figmaプラグインがビルドできない

```bash
# TailwindCSSのエラー確認
cd figma-plugin
npm run build:css

# TypeScriptのエラー確認
npm run type-check

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
```

### テストが失敗する

```bash
# キャッシュのクリア
npm test -- --clearCache

# 個別テストの実行
npm test -- path/to/test.ts

# 詳細なエラー出力
npm test -- --verbose
```

**詳細**: [getting-started.md](getting-started.md#トラブルシューティング)参照

## 関連ドキュメント

- [開発環境セットアップ](getting-started.md)
- [テストガイド](testing-guide.md)
- [API仕様](../api/endpoints.md)
- [アーキテクチャ概要](../architecture/overview.md)
