# Figma Plugin セットアップガイド

## 初回セットアップ

### 1. 依存関係のインストール

```bash
cd figma-plugin
npm install
```

### 2. 環境変数の設定

`.env.example`から`.env`ファイルを作成します：

```bash
cp .env.example .env
```

`.env`ファイルの内容を確認・編集：

```bash
# Figma Plugin Environment Variables

# API Base URL
# Development: http://localhost:3000/api
# Production: Your deployed backend URL
API_BASE_URL=http://localhost:3000/api
```

**開発環境の場合**: デフォルト値（`http://localhost:3000/api`）のまま使用できます。

**本番環境の場合**: デプロイ先のバックエンドURLに変更してください。

## ビルド方法

### 環境別ビルド

Figmaプラグインは環境変数をビルド時に埋め込むため、環境に応じたビルドコマンドを使用します。

#### 開発環境用ビルド

```bash
npm run build:dev
```

- `.env`ファイルから`API_BASE_URL`を読み込み
- 開発用の設定でビルド
- デフォルトでは`http://localhost:3000/api`を使用

#### 本番環境用ビルド

```bash
# 1. .envファイルを編集
# API_BASE_URL=https://your-production-api.com/api

# 2. 本番ビルド実行
npm run build:prod
```

- `.env`ファイルから本番用`API_BASE_URL`を読み込み
- 本番用の設定でビルド

### 開発時のウォッチモード

コードを変更するたびに自動的に再ビルドします：

```bash
npm run watch
```

- CSS（TailwindCSS）とJavaScriptを並行してウォッチ
- 自動的に開発環境設定を使用
- ファイル変更時に自動再ビルド

## ビルド出力

ビルドされたファイルは`build/`ディレクトリに出力されます：

```
build/
├── main.js    # メインスレッド（Figma API連携）
└── ui.js      # UIスレッド（Preact UI）
```

## Figma Desktopでの確認

### 1. プラグインのインポート

1. Figma Desktopアプリを開く
2. メニューから **Plugins > Development > Import plugin from manifest...**
   を選択
3. `figma-plugin/manifest.json`を選択

### 2. プラグインの実行

1. Figmaでフレームを選択
2. メニューから **Plugins > Development > Figma UI Reviewer** を選択
3. プラグインが起動し、選択したフレームを評価できます

### 3. リロード方法

コードを変更してビルドした後：

- **Plugins > Development > Hot reload plugin** を選択
- プラグインが最新のビルドで再読み込みされます

## 環境変数の仕組み

### ビルド時注入

Figmaプラグインにはランタイム環境変数がないため、環境変数はビルド時に文字列リテラルとして埋め込まれます。

**例**：

```typescript
// ソースコード (src/main.ts)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// ビルド後 (API_BASE_URL=https://api.example.com/api の場合)
const API_BASE_URL =
  'https://api.example.com/api' || 'http://localhost:3000/api';
```

### 重要な注意事項

1. **環境変数変更後は再ビルドが必須**
   - `.env`ファイルを変更した場合、必ず`npm run build:dev`または`npm run build:prod`を実行してください

2. **Figmaでのリロードも必要**
   - ビルド後、Figma Desktopで「Hot reload plugin」を実行してください

3. **環境変数は公開されます**
   - ビルド済みファイル（`build/main.js`, `build/ui.js`）に平文で埋め込まれます
   - 秘密情報（APIキーなど）は含めないでください
   - バックエンドURLのみを設定してください

## 利用可能な環境変数

現在サポートされている環境変数：

| 変数名         | 説明                       | デフォルト値                |
| -------------- | -------------------------- | --------------------------- |
| `API_BASE_URL` | バックエンドAPIのベースURL | `http://localhost:3000/api` |

## トラブルシューティング

### 環境変数が反映されない

**原因**: ビルド時に環境変数が読み込まれていない

**解決方法**:

```bash
# 1. .envファイルが存在するか確認
ls -la .env

# 2. buildディレクトリを削除して再ビルド
rm -rf build
npm run build:dev

# 3. ビルド結果を確認
grep -o "your-api-url" build/main.js
```

### 型エラーが出る

**原因**: TypeScriptが`process.env.API_BASE_URL`を認識できていない

**解決方法**:

```bash
# 1. env.d.tsが存在するか確認
ls src/env.d.ts

# 2. TypeScriptサーバーを再起動（VS Code）
# Cmd+Shift+P > "TypeScript: Restart TS Server"

# 3. 型チェックを実行
npm run type-check
```

### ビルドは成功するが動作しない

**原因**: Figmaプラグインがリロードされていない

**解決方法**:

1. Figma Desktopで **Plugins > Development > Hot reload plugin** を実行
2. または、Figmaを再起動してプラグインを再インポート

## 関連ドキュメント

- [プロジェクト全体のセットアップ](../development/getting-started.md)
- [開発用コマンド一覧](../development/commands.md)
- [アーキテクチャ概要](../architecture/overview.md)
