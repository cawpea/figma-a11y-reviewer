# Figma UI Reviewer

Figmaの情報をもとにAIを使って、UIデザインのレビューを行います。

> **📚 詳細なドキュメント**: より詳細な情報は[CLAUDE.md](./CLAUDE.md)および[docs/](./docs/README.md)を参照してください。

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

## CI/CD

### GitHub Actions

このプロジェクトでは、以下のワークフローが自動実行されます：

- **PR Check**: コード品質チェック（lint, type-check, format）とドキュメント検証
- **Documentation
  Check**: コード変更時のドキュメント更新確認（mainブランチへのPRのみ）
- **Test**: バックエンドとFigmaプラグインの自動テスト

詳細は以下を参照してください：

- [GitHub Actions ワークフロー](./docs/development/github-actions.md)
- [ドキュメント管理ガイド](./docs/development/documentation-management.md#cicdでの自動化)
