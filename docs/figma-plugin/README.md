# Figmaプラグイン実装ドキュメント

このディレクトリには、Figmaプラグインの実装詳細に関するドキュメントが含まれます。

## 📚 ドキュメント一覧

- **setup.md** - ビルド、インストール、開発ワークフロー、Figmaでのプラグイン実行方法
- **feature-toggles.md** - 機能トグルシステムの使い方と実装詳細

### 計画中のドキュメント

- **components/** - UIコンポーネントのサブディレクトリ
  - **README.md** - コンポーネント階層の概要図
  - **plugin-root.md** - Pluginルートコンポーネントの実装
  - **control-panel.md** - ControlPanel、SettingsPopoverの実装
  - **result-view.md** - ResultView、CategorySectionの実装
  - **ui-primitives.md** - Badge、Button、Checkboxなどの基本コンポーネント
- **hooks.md** - カスタムフック（useEvaluation、useAgentSelection、useOutsideClick）の詳細
- **figma-api.md** - Figma API統合（main.ts、メッセージング）
- **data-extraction.md** - ノードデータ抽出ロジック（figma.utils.ts）の詳細
- **styling.md** - TailwindCSS設定、ベストプラクティス、カスタムスタイル
- **testing.md** - コンポーネントテスト方法、Testing
  Library、ユーザーインタラクションテスト

## 🎯 このカテゴリの目的

Figmaプラグインの実装を理解し、UI機能の追加や修正を行うための詳細情報を提供します。コンポーネント開発やFigma
API連携時に参照してください。

## 🔗 関連ドキュメント

- [開発ガイド](../development/) - 開発環境のセットアップ
- [共通型](../shared/) - フロントエンド・バックエンド共通の型定義
