# スクリプト

このディレクトリには、プロジェクト管理とドキュメント保守のためのユーティリティスクリプトが含まれています。

## スクリプト一覧

### 1. validate-docs.js

ドキュメント内のコード参照（`CODE_REF`コメント）の整合性をチェックするスクリプトです。

**使用方法:**

```bash
# 基本的な検証
npm run validate:docs

# 詳細なログ付き検証
node scripts/validate-docs.js --verbose
```

**機能:**

- マークダウンファイル内の`<!-- CODE_REF: path/to/file.ts:10-20 -->`形式のコメントを検出
- 参照先のファイルの存在を確認
- 指定された行番号の妥当性をチェック
- エラーをグループ化してレポート

**CODE_REF形式:**

```markdown
<!-- CODE_REF: backend/src/index.ts -->
<!-- CODE_REF: figma-plugin/src/components/Badge/index.tsx:15-30 -->
```

### 2. update-docs-from-commits.js

作業ブランチのコミットログを解析し、CLAUDE.mdとdocsディレクトリのドキュメント更新を支援するスクリプトです。

**使用方法:**

```bash
# 基本的な使用（対話的モード）
npm run update:docs

# dry-runモード（変更内容のプレビューのみ）
npm run update:docs:dry-run

# 自動適用モード（確認なし）
npm run update:docs:auto

# カスタムオプション
node scripts/update-docs-from-commits.js --base=develop --output=changes.md
node scripts/update-docs-from-commits.js --verbose --dry-run
```

**オプション:**

| オプション        | 説明                                 | デフォルト |
| ----------------- | ------------------------------------ | ---------- |
| `--base=<branch>` | 比較元のブランチを指定               | `main`     |
| `--dry-run`       | 実際の更新は行わず、変更内容のみ表示 | `false`    |
| `--auto-apply`    | 確認なしで自動的に更新を適用         | `false`    |
| `--output=<file>` | 更新内容をファイルに出力             | なし       |
| `--verbose`, `-v` | 詳細なログを表示                     | `false`    |

**機能:**

1. **コミットログ解析**
   - 現在のブランチとベースブランチの差分を取得
   - Conventional Commits形式や絵文字プレフィックスを検出
   - コミットをカテゴリ別に分類（feature, bugfix, docs, refactor等）

2. **変更ファイル分析**
   - 変更されたファイルのパスと種類を特定
   - 影響を受けるドキュメント領域を自動検出
   - バックエンド、フロントエンド、共有コンポーネントなどを識別

3. **更新レポート生成**
   - コミットサマリーの一覧
   - 影響を受ける領域のリスト
   - カテゴリ別の変更詳細（新機能、バグフィックス、リファクタリング）
   - 推奨されるドキュメント更新

4. **ドキュメント更新**
   - CLAUDE.mdに変更履歴を追加（オプション）
   - 更新内容をMarkdownファイルに出力（オプション）

**コミットカテゴリの検出:**

以下のパターンを自動認識します:

- **feature**: `feat:`, `:sparkles:`
- **bugfix**: `fix:`, `:bug:`
- **docs**: `docs:`, `:memo:`, `:recycle:`（ドキュメント関連）
- **refactor**: `refactor:`, `:recycle:`, `:art:`
- **test**: `test:`, `:white_check_mark:`
- **chore**: `chore:`, `:wrench:`
- **performance**: `perf:`, `:zap:`

**出力例:**

```markdown
# ドキュメント更新レポート

**ブランチ**: `feature/new-agent` **比較元**: `main` **生成日時**: 2025/11/27
23:30:00

## コミットサマリー

合計 **3** 件のコミット

| コミット  | 日付       | 件名                                    | 作成者     |
| --------- | ---------- | --------------------------------------- | ---------- |
| `a1b2c3d` | 2025-11-27 | :sparkles: 新しい評価エージェントを追加 | John Doe   |
| `e4f5g6h` | 2025-11-27 | :bug: API エラーハンドリングを修正      | Jane Smith |
| `i7j8k9l` | 2025-11-27 | :recycle: コードのリファクタリング      | John Doe   |

## 影響を受ける領域

- backend
- agents
- api

## 新機能

### :sparkles: 新しい評価エージェントを追加 (`a1b2c3d`)

**変更されたファイル:**

- `backend/src/services/agents/new-agent.ts` (A)
- `backend/src/services/evaluation.service.ts` (M)

...
```

**ワークフロー例:**

```bash
# 1. 機能ブランチで開発
git checkout -b feature/new-feature
# ... コードを変更 ...
git commit -m ":sparkles: 新機能を追加"

# 2. dry-runで確認
npm run update:docs:dry-run

# 3. レポートをファイルに保存
node scripts/update-docs-from-commits.js --output=docs/changes.md --dry-run

# 4. ドキュメントを更新
npm run update:docs

# 5. 変更をコミット
git add CLAUDE.md docs/
git commit -m ":memo: ドキュメントを更新"
```

## ベストプラクティス

### コミットメッセージ

このスクリプトは以下のコミットメッセージ形式を推奨します:

1. **Conventional Commits**: `feat:`, `fix:`, `docs:`, など
2. **Gitmoji**: `:sparkles:`, `:bug:`, `:memo:`, など

例:

```bash
git commit -m "feat: 新しい評価エージェントを追加"
git commit -m ":sparkles: 新しい評価エージェントを追加"
git commit -m "fix(api): エラーハンドリングを修正"
```

### ドキュメント管理

1. **定期的な検証**: `npm run validate:docs`で定期的にドキュメントの整合性を確認
2. **PRマージ前**: ブランチマージ前に`npm run update:docs:dry-run`で変更内容を確認
3. **変更履歴**: 重要な変更は`--output`オプションでファイルに記録

### CI/CDでの使用

```yaml
# .github/workflows/docs-validation.yml
name: Validate Documentation

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run validate:docs
```

## トラブルシューティング

### validate-docs.js

**問題**: `FILE_NOT_FOUND` エラー

**解決策**: CODE_REFのパスがプロジェクトルートからの相対パスになっているか確認

**問題**: `LINE_OUT_OF_RANGE` エラー

**解決策**: 参照先のコードが変更された可能性があります。行番号を更新してください

### update-docs-from-commits.js

**問題**: コミットが検出されない

**解決策**: `--base`オプションで正しいベースブランチを指定しているか確認

**問題**: カテゴリが正しく認識されない

**解決策**: コミットメッセージにConventional
CommitsまたはGitmojiの形式を使用してください

## 開発

### スクリプトの追加

新しいスクリプトを追加する場合:

1. `scripts/`ディレクトリに新しいファイルを作成
2. shebang行 `#!/usr/bin/env node` を追加
3. `chmod +x scripts/your-script.js`で実行権限を付与
4. `package.json`の`scripts`セクションにエイリアスを追加
5. このREADMEにドキュメントを追加

### テスト

```bash
# dry-runモードでテスト
node scripts/update-docs-from-commits.js --dry-run --verbose

# 出力ファイルの確認
node scripts/update-docs-from-commits.js --output=test-output.md --dry-run
cat test-output.md
```

## CI/CDでの使用

### GitHub Actions統合

このプロジェクトでは、GitHub
Actionsを使用してドキュメントの品質を自動的にチェックしています。

#### 1. PR Check ワークフロー

すべてのPull Requestでドキュメント検証が実行されます。

**ファイル**: `.github/workflows/pr-check.yml`

```yaml
- name: Validate documentation references
  run: npm run validate:docs
```

**チェック内容**:

- `CODE_REF`コメントの参照先ファイルの存在
- 行番号の妥当性
- 不整合がある場合はPRをブロック

#### 2. Documentation Check ワークフロー

mainブランチへのPRで、コード変更とドキュメント更新の同期をチェックします。

**ファイル**: `.github/workflows/docs-check.yml`

**チェック内容**:

1. **validate-docs**: `CODE_REF`参照の整合性検証
2. **check-docs-update**: コード変更時のドキュメント更新確認
   - backend, figma-plugin, sharedのコードファイル変更を検出
   - docs/, CLAUDE.md, \*.mdの更新を確認
   - 更新がない場合、レポートをPRコメントとして投稿

#### ワークフロー実行例

**コード変更あり + ドキュメント更新あり**:

```
✅ ドキュメントが更新されています
```

**コード変更あり + ドキュメント更新なし**:

```
⚠️  コードが変更されていますが、ドキュメントの更新が検出されませんでした

推奨アクション:
- npm run update:docs:dry-run を実行して、必要な更新を確認してください
```

自動的にPRコメントが投稿され、更新レポートが表示されます。

#### 自動コメントの例

```markdown
## ⚠️ ドキュメント更新の確認

コードの変更が検出されましたが、ドキュメントの更新が見つかりませんでした。

### 推奨アクション

\`\`\`bash npm run update:docs:dry-run \`\`\`

### 自動生成されたレポート

<details>
<summary>ドキュメント更新レポートを表示</summary>

# ドキュメント更新レポート

...

</details>
```

### CI/CD設定のカスタマイズ

#### ドキュメント更新を必須にする

現在の設定では、ドキュメント更新は推奨（警告のみ）です。必須にする場合：

`.github/workflows/docs-check.yml`の`check-docs-update`ジョブを修正：

```yaml
- name: Check if documentation was updated
  if: steps.code_changes.outputs.code_changed == 'true'
  run: |
    if [ "$DOCS_UPDATED" = false ]; then
      echo "❌ ドキュメントの更新が必要です" >> $GITHUB_STEP_SUMMARY
      exit 1  # 失敗として扱う
    fi
```

#### チェック対象ファイルのカスタマイズ

コード変更の検出パターンを変更する場合：

```yaml
# 現在の設定
if [[ "$file" =~ ^(backend|figma-plugin|shared)/ ]] && [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then

# カスタマイズ例（テストファイルを除外）
if [[ "$file" =~ ^(backend|figma-plugin|shared)/ ]] && \
   [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]] && \
   [[ ! "$file" =~ \.test\. ]]; then
```

### ローカルでの事前確認

CI/CDでエラーにならないよう、PR作成前にローカルで確認：

```bash
# 1. ドキュメント検証
npm run validate:docs

# 2. 更新レポート生成
npm run update:docs:dry-run

# 3. 問題があれば修正
# ... ドキュメント更新 ...

# 4. 再検証
npm run validate:docs

# 5. コミット
git add docs/ CLAUDE.md
git commit -m ":memo: ドキュメントを更新"
```

## 参考リンク

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Gitmoji](https://gitmoji.dev/)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions - actions/github-script](https://github.com/actions/github-script)
