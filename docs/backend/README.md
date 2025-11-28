# バックエンド実装ドキュメント

このディレクトリには、バックエンドの実装詳細に関するドキュメントが含まれます。

## 📚 ドキュメント一覧

### 計画中のドキュメント

- **setup.md** - 環境構築、依存関係のインストール、開発サーバーの起動
- **services.md** - EvaluationServiceの詳細、評価の並列実行、エラーハンドリング
- **agents/** - 評価エージェントのサブディレクトリ
  - **README.md** - エージェントシステムの概要
  - **base-agent.md** - BaseEvaluationAgentの詳細実装
  - **accessibility.md** - アクセシビリティエージェント（WCAG 2.2 AA準拠）
  - **style-consistency.md** - スタイル一貫性エージェント
  - **usability.md** - ユーザビリティエージェント（Nielsen's 10原則）
  - **writing.md** - ライティングエージェント
  - **platform-compliance.md** - プラットフォーム準拠エージェント（iOS HIG /
    Material Design）
- **utilities.md** - ユーティリティ関数（prompt.utils、debug、accessibility）
- **middleware.md** - ミドルウェア（CORS、エラーハンドラー）
- **testing.md** - テスト戦略、モック方法、カバレッジ目標

## 🎯 このカテゴリの目的

バックエンドの実装を理解し、機能追加や修正を行うための詳細情報を提供します。評価ロジックの拡張やエージェント追加時に参照してください。

## 🔗 関連ドキュメント

- [API仕様](../api/) - エンドポイントの詳細
- [拡張ガイド](../guides/) - 新規エージェント追加方法
- [アーキテクチャ](../architecture/agent-system.md) - エージェントシステムの設計
