# ドキュメント管理ガイド

このガイドでは、プロジェクトのドキュメントを効率的に管理・更新する方法について説明します。

## 目次

- [概要](#概要)
- [ドキュメント構造](#ドキュメント構造)
- [ドキュメント更新ワークフロー](#ドキュメント更新ワークフロー)
- [自動化ツール](#自動化ツール)
- [コード参照の管理](#コード参照の管理)
- [ベストプラクティス](#ベストプラクティス)

## 概要

このプロジェクトでは、LLM（大規模言語モデル）が効率的にコードベースを理解できるよう、体系的なドキュメント構造を採用しています。主なドキュメントファイルは以下の通りです:

- **CLAUDE.md**: クイックリファレンス（LLMのエントリーポイント)
- **docs/**: 詳細なドキュメント（階層的に整理）

## ドキュメント構造

```
.
├── CLAUDE.md                    # LLM向けクイックリファレンス
├── docs/
│   ├── README.md                # ドキュメントナビゲーション
│   ├── architecture/            # システムアーキテクチャ
│   │   ├── overview.md
│   │   ├── data-flow.md
│   │   └── evaluation-agents.md
│   ├── api/                     # API仕様
│   │   └── endpoints.md
│   ├── backend/                 # バックエンド実装詳細
│   │   ├── agents/
│   │   ├── middleware/
│   │   └── services/
│   ├── figma-plugin/            # Figmaプラグイン詳細
│   │   ├── components.md
│   │   └── hooks.md
│   ├── development/             # 開発ガイド
│   │   ├── getting-started.md
│   │   ├── commands.md
│   │   ├── testing-guide.md
│   │   └── debugging.md
│   ├── guides/                  # ハウツーガイド
│   ├── reference/               # リファレンス
│   └── shared/                  # 共有型定義
└── scripts/
    ├── README.md                # スクリプトドキュメント
    ├── validate-docs.js         # ドキュメント検証
    └── update-docs-from-commits.js  # ドキュメント更新支援
```

### 各ディレクトリの役割

| ディレクトリ    | 内容                             | 対象読者                   |
| --------------- | -------------------------------- | -------------------------- |
| `architecture/` | システム設計、コンポーネント関係 | 新規開発者、設計レビュアー |
| `api/`          | REST APIエンドポイント仕様       | APIクライアント開発者      |
| `backend/`      | バックエンド実装詳細             | バックエンド開発者         |
| `figma-plugin/` | プラグイン実装詳細               | フロントエンド開発者       |
| `development/`  | 開発環境セットアップ、ツール     | 全開発者                   |
| `guides/`       | タスク別ハウツー                 | 全開発者                   |
| `reference/`    | 技術スタック、用語集             | 全開発者                   |
| `shared/`       | 共有型定義の説明                 | 全開発者                   |

## ドキュメント更新ワークフロー

### 1. 開発中

コードを変更する際は、関連するドキュメントも同時に更新します。

```bash
# 1. 機能ブランチで開発
git checkout -b feature/new-feature

# 2. コードとドキュメントを変更
# ... コード変更 ...
# ... ドキュメント更新 ...

# 3. コミット（意味のあるメッセージで）
git commit -m ":sparkles: 新機能を追加"
git commit -m ":memo: ドキュメントを更新"
```

### 2. PR作成前

PRを作成する前に、ドキュメントの整合性を確認します。

```bash
# ドキュメント内のコード参照を検証
npm run validate:docs

# コミットログから更新レポートを生成
npm run update:docs:dry-run

# または、レポートをファイルに保存
node scripts/update-docs-from-commits.js --output=pr-summary.md --dry-run
```

### 3. ドキュメント更新の適用

```bash
# 対話的モード（推奨）
npm run update:docs

# または、自動適用
npm run update:docs:auto

# 変更をコミット
git add CLAUDE.md docs/
git commit -m ":memo: コミットログからドキュメントを更新"
```

### 4. PRマージ後

mainブランチにマージされた後、必要に応じてドキュメントの最終調整を行います。

## 自動化ツール

### validate-docs.js

ドキュメント内のコード参照の整合性をチェックします。

**使い方:**

```bash
# 基本的な検証
npm run validate:docs

# 詳細なログ付き
node scripts/validate-docs.js --verbose
```

**機能:**

- `<!-- CODE_REF: path/to/file.ts:10-20 -->`形式のコメントを検出
- 参照先ファイルの存在確認
- 行番号の妥当性チェック

**詳細**: [scripts/README.md](../scripts/README.md#1-validate-docsjs)

### update-docs-from-commits.js

コミットログを解析してドキュメント更新を支援します。

**使い方:**

```bash
# dry-runモード（変更内容のプレビュー）
npm run update:docs:dry-run

# 対話的モード
npm run update:docs

# 自動適用モード
npm run update:docs:auto

# カスタムオプション
node scripts/update-docs-from-commits.js --base=develop --output=changes.md
```

**機能:**

- コミットログの解析とカテゴリ分類
- 変更ファイルの分析
- 影響を受けるドキュメント領域の特定
- 更新レポートの生成
- CLAUDE.mdへの変更履歴追加

**詳細**: [scripts/README.md](../scripts/README.md#2-update-docs-from-commitsjs)

## コード参照の管理

### CODE_REF コメント

ドキュメント内でコードスニペットを参照する際は、`CODE_REF`コメントを使用します。

**形式:**

```markdown
<!-- CODE_REF: path/to/file.ts -->
<!-- CODE_REF: path/to/file.ts:10-20 -->
```

**例:**

```markdown
## 評価エージェントの実装

<!-- CODE_REF: backend/src/services/agents/base-evaluation-agent.ts:15-45 -->

BaseEvaluationAgentクラスは以下のように実装されています:

\`\`\`typescript export abstract class BaseEvaluationAgent { //
... コードスニペット ... } \`\`\`
```

**メリット:**

- コード変更時にドキュメントの古さを検出できる
- 自動検証により整合性を保証
- ドキュメントとコードの乖離を防止

### 検証エラーの対処

**FILE_NOT_FOUND エラー:**

```bash
❌ FILE_NOT_FOUND: 参照先のファイルが見つかりません: backend/src/old-file.ts
```

対処:

1. ファイルパスが正しいか確認
2. ファイルが移動・削除された場合は、CODE_REFを更新

**LINE_OUT_OF_RANGE エラー:**

```bash
❌ LINE_OUT_OF_RANGE: 終了行番号がファイルの行数を超えています: 50 > 40
```

対処:

1. 参照先のコードが変更された可能性
2. 最新の行番号に更新

## ベストプラクティス

### コミットメッセージ

ドキュメント更新ツールが効果的に機能するよう、以下の形式を使用します:

**Conventional Commits:**

```bash
feat: 新機能を追加
fix: バグを修正
docs: ドキュメントを更新
refactor: コードのリファクタリング
test: テストを追加・修正
chore: ビルド設定などの変更
```

**Gitmoji（推奨）:**

```bash
:sparkles: 新機能を追加
:bug: バグを修正
:memo: ドキュメントを更新
:recycle: コードのリファクタリング
:white_check_mark: テストを追加・修正
:wrench: 設定ファイルを変更
```

### ドキュメント作成のガイドライン

#### 1. 明確な目的

各ドキュメントは明確な目的を持つべきです:

- **What（何）**: 機能・コンポーネントの説明
- **Why（なぜ）**: 設計判断の理由
- **How（どのように）**: 使用方法・実装方法

#### 2. 構造化

見出しレベルを適切に使用し、階層構造を明確にします:

```markdown
# ドキュメントタイトル（H1は1つのみ）

## 大セクション

### サブセクション

#### 詳細項目
```

#### 3. コード例

コード例は必ず動作確認済みのものを記載します:

```markdown
\`\`\`typescript // ❌ 悪い例: 動作しないコード const result =
someUndefinedFunction();

// ✅ 良い例: 動作確認済みのコード const result = evaluateUI(nodeData); \`\`\`
```

#### 4. リンク

関連ドキュメントへのリンクを積極的に使用します:

```markdown
詳細は[API仕様書](../api/endpoints.md)を参照してください。
```

#### 5. 更新日時

重要な更新があった場合は、ドキュメント末尾に記録します:

```markdown
---

**最終更新**: 2025-11-27 **更新内容**: 新しい評価エージェントの説明を追加
```

### 定期的なメンテナンス

#### 週次

```bash
# ドキュメント検証を実行
npm run validate:docs
```

#### リリース前

```bash
# コミットログから更新レポートを生成
npm run update:docs:dry-run

# ドキュメントを更新
npm run update:docs

# 検証
npm run validate:docs
```

#### 四半期ごと

- 全ドキュメントの内容レビュー
- 古い情報の削除・更新
- 新しいセクションの追加

### CI/CDでの自動化

このプロジェクトでは、GitHub
Actionsを使用してドキュメントの品質を自動的にチェックしています。

#### 実装されているワークフロー

1. **ドキュメント検証** (`.github/workflows/pr-check.yml`)
   - すべてのPRで`CODE_REF`参照の整合性をチェック
   - 参照先ファイルの存在と行番号の妥当性を検証

2. **ドキュメント更新チェック** (`.github/workflows/docs-check.yml`)
   - mainブランチへのPRでコードとドキュメントの同期をチェック
   - コード変更時にドキュメント更新を推奨
   - 自動生成されたレポートをPRコメントとして投稿

#### ワークフローの詳細

**PR Check (全PR対象)**

```yaml
name: PR Check

on:
  pull_request:
    branches:
      - main
    types: [opened, synchronize, reopened]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      # ... セットアップ ...
      - name: Validate documentation references
        run: npm run validate:docs
```

**Documentation Check (mainブランチへのPR)**

```yaml
name: Documentation Check

on:
  pull_request:
    branches:
      - main
    types: [opened, synchronize, reopened]

jobs:
  validate-docs:
    # CODE_REF参照の検証

  check-docs-update:
    # コード変更とドキュメント更新の確認
    # - backend/, figma-plugin/, shared/ のコード変更を検出
    # - docs/, CLAUDE.md, *.md の更新を確認
    # - 更新レポートの自動生成とPRコメント投稿
```

#### チェック内容

| チェック項目     | 説明                                | 失敗時の動作            |
| ---------------- | ----------------------------------- | ----------------------- |
| CODE_REF検証     | ドキュメント内のコード参照が有効か  | ❌ PRブロック           |
| コード変更検出   | backend, figma-plugin, sharedの変更 | ℹ️ 情報のみ             |
| ドキュメント更新 | docs/やMarkdownファイルの更新       | ⚠️ 警告（ブロックなし） |
| 更新レポート生成 | コミットログから推奨更新を生成      | ℹ️ PRコメントに表示     |

#### PRでの表示例

コード変更があるがドキュメント更新がない場合、以下のようなコメントが自動投稿されます：

```markdown
## ⚠️ ドキュメント更新の確認

コードの変更が検出されましたが、ドキュメントの更新が見つかりませんでした。

### 推奨アクション

以下のコマンドを実行して、ドキュメント更新の必要性を確認してください:

\`\`\`bash npm run update:docs:dry-run \`\`\`

### 自動生成されたレポート

<details>
<summary>ドキュメント更新レポートを表示</summary>

# ドキュメント更新レポート

...

</details>
```

#### GitHub Summaryでの確認

各ワークフロー実行後、GitHub Actions Summaryで以下の情報を確認できます：

- ✅/❌ ドキュメント検証結果
- 📝 コード変更の有無
- 📊 ドキュメント更新レポート
- 💡 推奨される更新内容

#### ローカルでの事前確認

CI/CDでエラーを避けるため、PR作成前にローカルで確認してください：

```bash
# ドキュメント検証
npm run validate:docs

# 更新レポートの確認
npm run update:docs:dry-run

# 問題があれば修正
# ... ドキュメント更新 ...

# 再検証
npm run validate:docs
```

## トラブルシューティング

### Q: ドキュメントが多すぎて更新が追いつかない

A: 以下を試してください:

1. `update-docs-from-commits.js`を使用して自動更新
2. 重要なドキュメントのみ厳密に管理
3. CODE_REFを使用してコードとの同期を自動化

### Q: LLMがドキュメントを見つけられない

A: CLAUDE.mdを確認してください:

1. 適切なセクションへのリンクがあるか
2. ドキュメント構造が明確か
3. docs/README.mdに検索マップがあるか

### Q: コード変更のたびにドキュメントを更新するのが大変

A: 以下を検討してください:

1. コードコメントを充実させる（自己文書化）
2. 型定義を明確にする（TypeScriptの活用）
3. テストコードを詳細にする（仕様の文書化）

## 参考資料

### 外部リンク

- [Write the Docs](https://www.writethedocs.org/)
- [Documentation Guide by Google](https://developers.google.com/style)
- [Markdown Guide](https://www.markdownguide.org/)

### プロジェクト内ドキュメント

- [scripts/README.md](../scripts/README.md) - スクリプトの詳細
- [docs/README.md](../docs/README.md) - ドキュメントナビゲーション
- [CLAUDE.md](../CLAUDE.md) - LLM向けクイックリファレンス

---

**最終更新**: 2025-11-27  
**更新内容**: ドキュメント管理ガイドを新規作成
