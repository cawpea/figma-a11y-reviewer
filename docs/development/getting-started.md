# 開発環境のセットアップ

このドキュメントでは、Figma UI
Reviewerの開発環境を初回セットアップする手順を説明します。

## 前提条件

以下のソフトウェアがインストールされている必要があります：

| ソフトウェア      | 必要なバージョン | 確認コマンド     |
| ----------------- | ---------------- | ---------------- |
| **Node.js**       | >= 18.x          | `node --version` |
| **npm**           | >= 9.x           | `npm --version`  |
| **Figma Desktop** | 最新版           | -                |
| **Git**           | >= 2.x           | `git --version`  |

### Node.jsのインストール

推奨: [nvm](https://github.com/nvm-sh/nvm)（Node Version Manager）を使用

```bash
# nvmのインストール（macOS/Linux）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Node.js 18のインストール
nvm install 18
nvm use 18
```

## リポジトリのクローン

```bash
git clone https://github.com/cawpea/figma-ui-reviewer.git
cd figma-ui-reviewer
```

## 1. バックエンドAPIのセットアップ

### 1.1 依存関係のインストール

```bash
cd backend
npm install
```

### 1.2 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成します：

```bash
# backend/.env.example を .env にコピー
cp .env.example .env
```

`.env`ファイルに以下を記述：

```bash
# 必須: Anthropic API キー
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# オプション: サーバー設定
PORT=3000

# オプション: CORS設定（開発環境では * でOK）
CORS_ORIGIN=*
```

**注意**: `NODE_ENV`は`.env`ファイルで設定する必要はありません。npm
scriptsで自動的に設定されます（`dev`コマンドは`development`、`deploy`コマンドは`production`）。

#### Anthropic APIキーの取得方法

1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. アカウントを作成またはログイン
3. "API Keys" セクションから新しいAPIキーを生成
4. 生成されたキーを`.env`ファイルにコピー

**重要**:
APIキーは秘密情報です。Gitにコミットしないでください（`.gitignore`で除外済み）。

### 1.3 TypeScriptのビルド（オプション）

```bash
npm run build:dev
```

このコマンドは`dist/`ディレクトリにJavaScriptをコンパイルしますが、開発時は不要です（`npm run dev`がts-nodeで直接実行します）。

### 1.4 開発サーバーの起動

```bash
npm run dev
```

**期待される出力**:

```
[nodemon] starting `ts-node src/index.ts`
🚀 Server running on http://localhost:3000
✅ Backend API is ready!
```

### 1.5 ヘルスチェック

別のターミナルで以下のコマンドを実行し、サーバーが正常に起動しているか確認：

```bash
curl http://localhost:3000/api/health
```

**期待されるレスポンス**:

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:45.123Z"
}
```

---

## 2. Figmaプラグインのセットアップ

### 2.1 依存関係のインストール

```bash
cd ../figma-plugin  # backend/から移動
npm install
```

### 2.2 環境変数の設定

開発環境用の環境変数ファイルを作成します：

```bash
# 開発環境用（デフォルトの設定で使用可能）
cp .env.development.example .env.development
```

`.env.development`の内容：

```bash
# Development Environment Variables

# API Base URL for local development
API_BASE_URL=http://localhost:3000/api
```

**本番環境用**には`.env.production`を作成します：

```bash
# 本番環境用の設定をコピー
cp .env.production.example .env.production

# .env.productionを編集して実際のAPIのURLを設定
# API_BASE_URL=https://your-production-api.example.com/api
```

**重要**:

- 環境変数はビルド時にコードに埋め込まれます
- 環境変数を変更した場合は必ず再ビルドしてください
- 秘密情報（APIキーなど）は含めないでください（バックエンドURLのみ）

### 2.3 ビルド

#### 開発環境用ビルド

```bash
npm run build:dev
```

このコマンドは以下を実行します：

1. **TailwindCSS**: `src/input.css` → `src/output.css`
2. **環境変数読み込み**: `.env.development`から`API_BASE_URL`を読み込み
3. **TypeScript**: `src/main.ts`, `src/ui.tsx` → `build/main.js`,
   `build/ui.js`（環境変数を埋め込み）
4. **Manifest**: `manifest.json` → `build/manifest.json`

#### 本番環境用ビルド

```bash
npm run build:prod
```

`.env.production`から環境変数を読み込んでビルドします。

**期待される出力**:

```
> build:dev
> npm run build:css && cross-env NODE_ENV=development npm run build:js

Rebuilding...
Done in 150ms.
```

### 2.4 Watchモード（推奨）

開発時は、ファイル変更を自動検知してビルドするWatchモードが便利です：

```bash
npm run watch
```

これにより、`src/`ディレクトリ内のファイルを変更すると自動的に再ビルドされます。

---

## 3. Figmaでのプラグイン実行

### 3.1 プラグインのインポート

1. **Figma Desktop**アプリを開く
2. メニューから **Plugins** > **Development** > **Import plugin from
   manifest...** を選択
3. `figma-plugin/manifest.json`を選択

**注**:
`manifest.json`はルートではなく、`figma-plugin/`ディレクトリ内にあります。

### 3.2 プラグインの実行

1. Figmaでデザインファイルを開く
2. **フレーム**や**コンポーネント**を選択
3. メニューから **Plugins** > **Development** > **Figma UI Reviewer** を選択

プラグインウィンドウが開き、UIが表示されます。

### 3.3 評価の実行

1. **Settings** アイコンをクリックして評価エージェントを選択
2. **Evaluate Design** ボタンをクリック
3. バックエンドAPIが起動していることを確認（`http://localhost:3000`）
4. 評価結果が表示されるまで待機（20-40秒）

---

## 4. 開発ワークフロー

### 推奨セットアップ

開発時は以下の3つのターミナルを開いておくと効率的です：

#### ターミナル1: バックエンドAPI

```bash
cd backend
npm run dev
```

#### ターミナル2: Figmaプラグイン（Watchモード）

```bash
cd figma-plugin
npm run watch
```

#### ターミナル3: その他のコマンド（テスト、Git等）

```bash
# テスト実行
npm test

# 型チェック
npm run type-check

# Gitコマンド
git status
git add .
git commit -m "feat: add new feature"
```

### コード変更時の手順

#### バックエンドの変更

1. `backend/src/`内のファイルを編集
2. **保存**（nodemonが自動的にサーバーを再起動）
3. ブラウザまたはcURLでAPIをテスト

#### プラグインの変更

1. `figma-plugin/src/`内のファイルを編集
2. **保存**（Watchモードが自動的にビルド）
3. Figmaで **Plugins** > **Development** > **Figma UI Reviewer** を再実行

**注**: プラグインのコード変更後は、Figmaで再度プラグインを実行する必要があります（ホットリロードは非対応）。

---

## 5. トラブルシューティング

### 問題1: `ANTHROPIC_API_KEY is not set`

**原因**: 環境変数が設定されていない

**解決策**:

1. `backend/.env`ファイルが存在するか確認
2. `.env`内に`ANTHROPIC_API_KEY=sk-ant-...`が記述されているか確認
3. サーバーを再起動

### 問題2: `PORT 3000 is already in use`

**原因**: 別のプロセスがポート3000を使用している

**解決策**:

```bash
# macOS/Linuxでポート3000を使用しているプロセスを特定
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または、別のポートを使用
PORT=3001 npm run dev
```

### 問題3: Figmaプラグインが表示されない

**原因**: ビルドが失敗しているか、manifestが正しくない

**解決策**:

```bash
# ビルドエラーを確認
cd figma-plugin
npm run build:dev

# manifest.jsonが存在するか確認
ls manifest.json

# Figmaでプラグインを再インポート
```

### 問題4: `Cannot find module '@shared/types'`

**原因**: `shared/`パッケージがビルドされていない

**解決策**:

```bash
# ルートディレクトリから
cd shared
npm run build:dev

# または、各パッケージのnode_modulesを再インストール
cd backend
npm install
cd ../figma-plugin
npm install
```

### 問題5: TailwindCSSのスタイルが反映されない

**原因**: `output.css`が生成されていない

**解決策**:

```bash
cd figma-plugin
npm run build:css

# Watchモードを使用
npm run watch
```

---

## 6. 次のステップ

セットアップが完了したら、以下のドキュメントを参照してください：

- [開発ワークフロー](./development-workflow.md) - 日常的な開発作業
- [コーディング規約](./coding-standards.md) - プロジェクトのコーディング規約
- [テストガイド](./testing-guide.md) - テストの作成と実行
- [デバッグ方法](./debugging.md) - デバッグログとツールの使用

---

## 付録: ディレクトリ構造

```
figma-ui-reviewer/
├── backend/                # バックエンドAPI
│   ├── src/               # TypeScriptソースコード
│   ├── dist/              # ビルド後のJavaScript（git ignore）
│   ├── logs/              # デバッグログ（開発環境のみ）
│   ├── .env               # 環境変数（git ignore）
│   └── package.json
├── figma-plugin/          # Figmaプラグイン
│   ├── src/              # TypeScriptソースコード
│   ├── build/            # ビルド後のファイル（git ignore）
│   ├── manifest.json     # Figmaプラグイン設定
│   └── package.json
├── shared/               # 共通型定義
│   ├── src/types.ts
│   └── package.json
└── docs/                 # ドキュメント
```

## 環境変数一覧

### バックエンド（backend/.env）

| 変数名              | 必須 | デフォルト値 | 説明                                                                          |
| ------------------- | ---- | ------------ | ----------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | ✅   | -            | Anthropic APIキー                                                             |
| `PORT`              | ❌   | `3000`       | サーバーポート                                                                |
| `NODE_ENV`          | ❌   | -            | npm scriptsで自動設定（.envでの設定不要、dev→development、deploy→production） |
| `CORS_ORIGIN`       | ❌   | `*`          | CORS許可オリジン（本番では制限推奨）                                          |

### Figmaプラグイン（figma-plugin/.env.{development|production}）

| 変数名         | 必須 | デフォルト値                | 説明                       |
| -------------- | ---- | --------------------------- | -------------------------- |
| `API_BASE_URL` | ❌   | `http://localhost:3000/api` | バックエンドAPIのベースURL |

**注意**:
Figmaプラグインの環境変数はビルド時にコードに埋め込まれるため、変更後は必ず再ビルドが必要です。
