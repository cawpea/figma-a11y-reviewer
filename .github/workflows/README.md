# GitHub Actions ワークフロー

このディレクトリには、CI/CDパイプラインを自動化するGitHub
Actionsワークフローが含まれています。

## ワークフロー一覧

### 1. PR Check (pr-check.yml)

すべてのPull Requestで実行される基本的なコード品質チェック。

**トリガー**: mainブランチへのPR（opened, synchronize, reopened）

**チェック内容**:

- ✅ コードフォーマット（Prettier）
- ✅ Lint（ESLint）
- ✅ 型チェック（TypeScript）
- ✅ ドキュメント検証（CODE_REF参照）

**ジョブ**:

- `check`: フォーマット、lint、型チェック、ドキュメント検証

### 2. Documentation Check (docs-check.yml)

mainブランチへのPRで、コード変更とドキュメント更新の同期をチェック。

**トリガー**: mainブランチへのPR（opened, synchronize, reopened）

**チェック内容**:

- ✅ CODE_REF参照の整合性
- 📝 コード変更の検出（backend, figma-plugin, shared）
- 📊 ドキュメント更新の確認
- 💬 更新レポートのPRコメント投稿

**ジョブ**:

1. `validate-docs`: CODE_REF参照の検証
2. `check-docs-update`: コード変更とドキュメント更新の確認
3. `summary`: 結果サマリー

**動作フロー**:

```
コード変更検出
  ↓
  YES → ドキュメント更新確認
         ↓
         更新あり → ✅ OK
         更新なし → ⚠️ 警告 + PRコメント投稿
  ↓
  NO → ℹ️ スキップ
```

**PRコメント例**:

```markdown
## ⚠️ ドキュメント更新の確認

コードの変更が検出されましたが、ドキュメントの更新が見つかりませんでした。

### 推奨アクション

npm run update:docs:dry-run

### 自動生成されたレポート

[詳細表示]
```

### 3. Test (test.yml)

自動テストとカバレッジレポート生成。

**トリガー**:

- pushイベント（main, developブランチ）
- Pull Request（main, developブランチ）

**ジョブ**:

1. `test-backend`: バックエンドのテスト実行
2. `test-figma-plugin`: Figmaプラグインのテスト実行
3. `coverage-report`: カバレッジレポートの統合
4. `lint-and-type-check`: Lint・型チェック
5. `test-summary`: テスト結果のサマリー

### 4. Claude Code Review (claude-code-review.yml)

AIによる自動コードレビュー。

**トリガー**: Pull Request（任意のブランチ）

### 5. Claude (claude.yml)

詳細不明（既存のワークフロー）

## ワークフロー実行の確認

### GitHub UI

1. リポジトリのActionsタブを開く
2. 左サイドバーからワークフローを選択
3. 実行履歴と結果を確認

### ローカルでの事前確認

CI/CDでエラーにならないよう、コミット前に確認：

```bash
# フォーマット・Lint・型チェック
npm run check

# テスト実行
npm test

# ドキュメント検証
npm run validate:docs

# ドキュメント更新チェック
npm run update:docs:dry-run
```

## トラブルシューティング

### ドキュメント検証エラー

**エラー**: `CODE_REF: FILE_NOT_FOUND`

**対処**:

```bash
# ドキュメント検証を実行
npm run validate:docs

# エラー箇所を修正
# docs/ 内のCODE_REFコメントを更新

# 再検証
npm run validate:docs
```

### ドキュメント更新警告

**警告**: コード変更があるがドキュメント更新がない

**対処**:

```bash
# 更新レポートを確認
npm run update:docs:dry-run

# 必要に応じてドキュメントを更新
# ... 編集 ...

# コミット
git add docs/ CLAUDE.md
git commit -m ":memo: ドキュメントを更新"
```

### テスト失敗

**エラー**: テストが失敗

**対処**:

```bash
# ローカルでテスト実行
npm test

# 失敗したテストを修正
# ... 修正 ...

# 再テスト
npm test
```

## ワークフローのカスタマイズ

### ドキュメント更新を必須にする

現在、ドキュメント更新は推奨（警告のみ）です。必須にする場合：

`.github/workflows/docs-check.yml`を編集：

```yaml
- name: Check if documentation was updated
  run: |
    if [ "$DOCS_UPDATED" = false ]; then
      exit 1  # 失敗として扱う
    fi
```

### チェック対象ファイルの変更

コード変更の検出パターンを変更する場合：

```yaml
# テストファイルを除外する例
if [[ "$file" =~ ^(backend|figma-plugin|shared)/ ]] && \ [[ "$file" =~
\.(ts|tsx|js|jsx)$ ]] && \ [[ ! "$file" =~ \.test\. ]]; then
```

### 通知設定

Slack通知を追加する例：

```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'ドキュメントチェックが失敗しました'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## ベストプラクティス

### コミット前

```bash
# すべてのチェックをローカルで実行
npm run check
npm test
npm run validate:docs
```

### PR作成前

```bash
# ドキュメント更新を確認
npm run update:docs:dry-run

# 必要に応じて更新
npm run update:docs
```

### マージ前

- すべてのワークフローが✅（成功）であることを確認
- ドキュメント更新警告がある場合は内容を確認

## 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ドキュメント管理ガイド](../../docs/development/documentation-management.md)
- [スクリプトドキュメント](../../scripts/README.md)
