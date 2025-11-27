# Figma UI Reviewer

Figmaの情報をもとにAIを使って、UIデザインのレビューを行います。

> **Note**: ドキュメント検証ワークフローのテスト中

## Figma Plugin

### ビルド方法

```sh
# ビルド
cd figma-plugin
npm run build

# Figmaで確認
# 1. Figma Desktopアプリを開く
# 2. Plugins > Development > Import plugin from manifest
# 3. figma-plugin/manifest.json を選択
# 4. フレームを選択してプラグインを実行
```

## API

### APIの起動

```sh
cd backend
npm run dev
```

### 有料APIの利用

`backend/.env`ファイルにAnthropicのAPI Keyを設定してください。

```
ANTHROPIC_API_KEY=***
```
