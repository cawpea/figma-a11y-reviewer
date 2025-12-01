# ドキュメンテーションガイドライン

このドキュメントは、Figma UI
Reviewerプロジェクトのドキュメント作成・更新の統一ルールを定めたものです。

## 📚 目的と対象読者

### 目的

1. **一貫性の確保**: 全ドキュメントで統一されたスタイルとフォーマットを維持
2. **保守性の向上**: コード変更に追従しやすいドキュメント構造の実現
3. **検索性の向上**: 人間とAI（Claude Code）の両方が効率的に情報を見つけられる
4. **品質の保証**: CODE_REFシステムによるコードとドキュメントの整合性維持

### 対象読者

- **人間の開発者**: 新規参加者、既存チームメンバー、コントリビューター
- **AI（Claude Code）**: 自動ドキュメント更新、コード変更時の同期

---

## 1. ドキュメント構造

### 1.1 ディレクトリ構成

```
docs/
├── README.md                 # ナビゲーションハブ（LLM検索マッピング含む）
├── architecture/             # システムアーキテクチャ
│   ├── README.md
│   └── *.md
├── api/                      # API仕様
│   ├── README.md
│   └── *.md
├── backend/                  # バックエンド実装
│   ├── README.md
│   └── *.md
├── deployment/               # デプロイメント
│   ├── README.md
│   └── *.md
├── development/              # 開発ガイド
│   ├── README.md
│   └── *.md
├── figma-plugin/             # プラグイン実装
│   ├── README.md
│   └── *.md
└── shared/                   # 共有型定義
    ├── README.md
    └── *.md
```

### 1.2 ファイル命名規則

**原則**: 小文字のケバブケース（lowercase-with-hyphens）

**良い例**:

- `getting-started.md`
- `documentation-guidelines.md`
- `error-handling.md`

**悪い例**:

- `GettingStarted.md` （パスカルケース）
- `getting_started.md` （スネークケース）
- `gettingstarted.md` （区切りなし）

**特例**:

- `README.md` - カテゴリナビゲーション用（大文字必須）

### 1.3 README.md の役割

各カテゴリの`README.md`は以下を含める：

```markdown
# [カテゴリ名] ドキュメント

## 📚 ドキュメント一覧

### 実装済みドキュメント

- **file-name.md** - 説明文（何について書かれているか）

### 計画中のドキュメント

- **planned-file.md** - 説明文

## 🎯 このカテゴリの目的

[このカテゴリが何をカバーするかの簡潔な説明]

## 🔗 関連ドキュメント

- [他カテゴリへのリンク](../other-category/)
```

---

## 2. 文書作成規則

### 2.1 日本語スタイルガイド

#### 語調

**です・ます調**を使用（親しみやすく、読みやすい）

**良い例**:

```markdown
このコマンドは、ドキュメントの整合性をチェックします。
```

**悪い例**:

```markdown
このコマンドは、ドキュメントの整合性をチェックする。（である調）
```

#### 技術用語の扱い

- **英語の技術用語**: そのまま使用（例: API、TypeScript、React、CORS）
- **カタカナ表記**: 一般的に浸透している場合のみ（例: プラグイン、フレームワーク）
- **混在の回避**: 同じ概念には統一した用語を使用

**例**:

```markdown
✅ Claude APIを呼び出してレスポンスを取得します✅
Figmaプラグインはデータを抽出します❌ クロード APIを呼び出してレスポンスを取得します❌
Figma プラグインはデータを抽出します（不要なスペース）
```

#### 句読点

- **句点**: 「。」（全角）
- **読点**: 「、」（全角）
- **コロン**: 「:」（半角）- 見出し後や箇条書き前
- **スラッシュ**: 「/」（半角）

#### 箇条書き

**番号なし**（`-`）:

```markdown
- 項目1
- 項目2
- 項目3
```

**番号付き**:

```markdown
1. 最初のステップ
2. 次のステップ
3. 最後のステップ
```

**ネスト**（2スペースインデント）:

```markdown
- 親項目
  - 子項目1
  - 子項目2
```

### 2.2 Markdown記法

#### 見出しレベル

```markdown
# H1 - ドキュメントタイトル（ページに1つのみ）

## H2 - 主要セクション

### H3 - サブセクション

#### H4 - 詳細項目
```

**ルール**:

- H1は1ページに1つのみ（ドキュメントタイトル）
- 見出しレベルをスキップしない（H2 → H4は禁止）
- 見出しの前後に空行を入れる

#### コードブロック

**インラインコード**:

```markdown
`npm run dev` コマンドで開発サーバーを起動します
```

**コードブロック**:

````markdown
```typescript
function hello(): string {
  return 'Hello, World!';
}
```
````

**言語指定**（必須）:

- `typescript` - TypeScript/JavaScript
- `bash` - シェルコマンド
- `json` - JSON
- `markdown` - Markdown例

#### テーブル

```markdown
| 列1     | 列2     | 列3     |
| ------- | ------- | ------- |
| データ1 | データ2 | データ3 |
| データ4 | データ5 | データ6 |
```

**ルール**:

- ヘッダー行は必須
- セパレーター行（`---`）は必須
- 列の配置は左寄せ（デフォルト）

#### リンク

**相対パス**（推奨）:

```markdown
[関連ドキュメント](./architecture/overview.md) [別カテゴリ](../api/endpoints.md)
```

**アンカーリンク**:

```markdown
[セクションへ](#セクション名)
```

**外部リンク**:

```markdown
[Figma Plugin API](https://www.figma.com/plugin-docs/)
```

### 2.3 絵文字の使用規則

#### 標準絵文字一覧

| 絵文字 | 用途                       | 使用例                              |
| ------ | -------------------------- | ----------------------------------- |
| 📚     | ドキュメント、リスト       | `## 📚 ドキュメント一覧`            |
| 🎯     | 目的、ゴール               | `## 🎯 このカテゴリの目的`          |
| 🔍     | 検索、調査                 | `## 🔍 LLM向け検索マッピング`       |
| 📝     | コード参照、注記           | `## 📝 コード引用のルール`          |
| ✅     | 完了、成功                 | `✅ すべての検証が完了しました`     |
| ❌     | エラー、禁止               | `❌ 一部の検証でエラー`             |
| 💡     | ヒント、ベストプラクティス | `## 💡 ベストプラクティス`          |
| 🔗     | 関連リンク                 | `## 🔗 関連ドキュメント`            |
| 🔥     | 重要事項                   | `🔥 重要: 必ず実行してください`     |
| ⚙️     | 設定、構成                 | `## ⚙️ 環境設定`                    |
| 🔄     | 更新、同期                 | `## 🔄 ドキュメント更新`            |
| 📋     | チェックリスト             | `## 📋 セットアップ手順`            |
| 🛠️     | ツール、ユーティリティ     | `## 🛠️ 開発ツール`                  |
| 📊     | データ、統計               | `## 📊 パフォーマンス指標`          |
| 🚀     | デプロイ、リリース         | `## 🚀 本番デプロイ`                |
| ⚠️     | 警告、注意                 | `⚠️ 注意: この操作は元に戻せません` |

#### 使用場面

**見出しでの使用**（推奨）:

```markdown
## 📚 ドキュメント一覧

## 🎯 目的

## 💡 ベストプラクティス
```

**本文での使用**（控えめに）:

```markdown
✅ テストが成功しました ❌ ビルドに失敗しました 💡 ヒント: キャッシュをクリアしてみてください
```

---

## 3. CODE_REFシステム

### 3.1 基本形式

CODE_REFは、ドキュメント内でコードスニペットが実際のコードのどこを参照しているかを明示するシステムです。

#### 構文

```markdown
<!-- CODE_REF: <relative-path>:<start-line>-<end-line> -->
```

#### パラメータ

- **relative-path**: プロジェクトルートからの相対パス
- **start-line**: 開始行番号（1始まり）
- **end-line**: 終了行番号

#### 形式パターン

**1. 行範囲指定**（推奨）:

```html
<!-- CODE_REF: backend/src/services/agents/base.agent.ts:15-45 -->
```

**2. ファイル全体参照**:

```html
<!-- CODE_REF: backend/src/config/anthropic.ts -->
```

### 3.2 使用例

#### 基本的な使用方法

以下は実際のコード参照の例です：

```markdown
Figmaノードからデータを抽出する関数は以下のように実装されています：

<!-- CODE_REF: figma-plugin/src/utils/figma.utils.ts:12-45 -->

\`\`\`typescript /\*\*

- Figmaノードからデータを再帰的に抽出
- 最大深度: 10階層 \*/ export async function extractNodeData( node: SceneNode,
  depth: number = 0 ): Promise<FigmaNodeData> { const MAX_DEPTH = 10;

if (depth > MAX_DEPTH) { return { id: node.id, name: node.name, type: node.type,
note: 'Max depth reached', }; }

// 基本情報の抽出 const data: FigmaNodeData = { id: node.id, name: node.name,
type: node.type, };

// ... 続く return data; } \`\`\`
```

#### 複数のコード参照

````markdown
評価エージェントの基底クラスは以下の責務を持ちます：

<!-- CODE_REF: backend/src/services/agents/base.agent.ts:14-50 -->

```typescript
export abstract class BaseEvaluationAgent {
  protected abstract systemPrompt: string;
  protected abstract category: string;

  /**
   * Claude APIを呼び出す
   */
  protected async callClaude(prompt: string): Promise<Anthropic.Message> {
    // ...
  }
}
```

エージェントは`evaluation.service.ts`で並列実行されます：

<!-- CODE_REF: backend/src/services/evaluation.service.ts:38-80 -->

```typescript
// 並列実行（Promise.all）
const evaluationPromises = typesToRun.map(async (type) => {
  // ...
});
```
````

### 3.3 検証方法

#### 自動検証コマンド

```bash
# 全検証（CODE_REF + ドキュメント更新確認）
npm run validate:docs

# CODE_REF検証のみ
npm run validate:docs:code

# ドキュメント更新確認のみ
npm run validate:docs:update
```

#### 検証内容

1. **ファイル存在チェック**: 参照先ファイルが存在するか
2. **行番号チェック**: 指定された行番号が有効範囲内か
3. **整合性チェック**: コードが変更されていないか

#### エラーの解決方法

**エラー例1: ファイルが見つからない**

```
❌ CODE_REF エラー: backend/src/old-file.ts が見つかりません
   場所: docs/backend/services.md:45
```

**解決策**:

1. ファイルパスが正しいか確認
2. ファイルが移動/削除された場合は、CODE_REFを更新

**エラー例2: 行番号が範囲外**

```
❌ CODE_REF エラー: 行番号 100-120 が範囲外です（ファイルは80行）
   場所: docs/api/endpoints.md:150
```

**解決策**:

1. 実際のコードを確認
2. 正しい行番号に更新

---

## 4. 新規ドキュメント作成ガイド

### 4.1 作成前のチェックリスト

新しいドキュメントを作成する前に、以下を確認してください：

- [ ] **既存ドキュメントの確認**: 同様の内容が既に存在しないか
- [ ] **カテゴリの選定**: 適切なディレクトリ（architecture/api/backend/etc.）
- [ ] **ファイル名の決定**: ケバブケースで明確な名前
- [ ] **関連ドキュメントの特定**: クロスリファレンス先のリストアップ
- [ ] **CODE_REF対象の特定**: 参照すべきコードの場所

### 4.2 作成ステップ

#### ステップ1: テンプレートを選択

用途に応じたテンプレートを使用（[4.3 ドキュメントテンプレート](#43-ドキュメントテンプレート)参照）

#### ステップ2: 必須セクションを記入

すべてのドキュメントに含めるべき要素：

1. **タイトル**（H1）
2. **概要**（このドキュメントの目的）
3. **主要セクション**（H2）
4. **関連ドキュメントリンク**（最後）

#### ステップ3: CODE_REFを追加

重要なコードスニペットには必ずCODE_REFを追加：

````markdown
<!-- CODE_REF: path/file/path.ts:10-30 -->

```typescript
// コードスニペット
```
````

**注**: `path/file/path.ts` は実際のファイルパスに置き換えてください

#### ステップ4: クロスリファレンスを設定

関連ドキュメントへのリンクを追加：

```markdown
## 次のステップ

- [関連ドキュメント1](./related-doc.md)
- [関連ドキュメント2](../other-category/doc.md)
```

#### ステップ5: 検証を実行

```bash
npm run validate:docs
```

#### ステップ6: カテゴリREADMEを更新

該当カテゴリの`README.md`に新しいドキュメントを追加：

```markdown
### 実装済みドキュメント

- **new-document.md** - 新しいドキュメントの説明
```

### 4.3 ドキュメントテンプレート

#### テンプレート1: 概要ドキュメント

````markdown
# [機能/システム名] 概要

このドキュメントでは、[機能/システム名]の全体像と設計思想を説明します。

## システム構成

[システム構成図やアーキテクチャ図]

## 主要コンポーネント

| コンポーネント | 責務         | 実装場所       |
| -------------- | ------------ | -------------- |
| Component A    | [責務の説明] | `path/to/file` |
| Component B    | [責務の説明] | `path/to/file` |

## データフロー

[データの流れを説明]

```html
<!-- CODE_REF: path/file/path.ts:10-30 -->
```
````

```typescript
// 主要な処理の例
```

## 技術選定

| 技術       | 用途   | 選定理由 |
| ---------- | ------ | -------- |
| Technology | [用途] | [理由]   |

## 次のステップ

- [詳細ドキュメント1](./detail1.md)
- [詳細ドキュメント2](./detail2.md)

````

#### テンプレート2: API仕様書

```markdown
# [API名] 仕様

このドキュメントでは、[API名]のエンドポイント仕様を説明します。

## ベースURL

- **開発環境**: `http://localhost:3000`
- **本番環境**: `https://api.example.com`

## エンドポイント一覧

| メソッド | パス         | 説明           | 認証 |
| -------- | ------------ | -------------- | ---- |
| POST     | `/api/path`  | [説明]         | 必要 |
| GET      | `/api/path`  | [説明]         | 不要 |

---

## POST /api/path

[エンドポイントの詳細説明]

### リクエスト

#### Headers

````

Content-Type: application/json Authorization: Bearer <token>

````

#### Body

```html
<!-- CODE_REF: backend/src/routes/your-route.ts:10-30 -->
````

```typescript
{
  "field1": string,
  "field2": number
}
```

### レスポンス

#### 成功時（200 OK）

```json
{
  "success": true,
  "data": { ... }
}
```

#### エラー時（4xx, 5xx）

```json
{
  "success": false,
  "error": "Error message"
}
```

## 次のステップ

- [実装詳細](../backend/implementation.md)
- [エラーハンドリング](./error-handling.md)

````

#### テンプレート3: 実装詳細

```markdown
# [機能名] 実装詳細

このドキュメントでは、[機能名]の実装の詳細を説明します。

## 概要

[機能の簡潔な説明]

## 実装ファイル

| ファイル               | 責務               |
| ---------------------- | ------------------ |
| `path/to/file1.ts`     | [責務]             |
| `path/to/file2.ts`     | [責務]             |

## 主要クラス/関数

### ClassName

```html
<!-- CODE_REF: path/to/your-file.ts:10-50 -->
````

```typescript
export class ClassName {
  // 実装
}
```

**責務**:

- 責務1
- 責務2

**使用例**:

```typescript
const instance = new ClassName();
instance.method();
```

## テスト

テストは以下の場所にあります：

```html
<!-- CODE_REF: path/to/your-file.test.ts:10-30 -->
```

```typescript
describe('ClassName', () => {
  it('should ...', () => {
    // テストコード
  });
});
```

## 次のステップ

- [関連機能](./related.md)
- [API仕様](../api/endpoints.md)

````

#### テンプレート4: ハウツーガイド

```markdown
# [タスク名] ガイド

このドキュメントでは、[タスク名]の手順を説明します。

## 前提条件

- 条件1
- 条件2

## 手順

### 1. [ステップ1の説明]

```bash
command-here
````

**説明**: [何をするコマンドか]

### 2. [ステップ2の説明]

```html
<!-- CODE_REF: path/to/your-file.ts:10-20 -->
```

```typescript
// 設定例
```

### 3. [ステップ3の説明]

[詳細な説明]

## トラブルシューティング

### 問題1: [問題の説明]

**原因**: [原因]

**解決策**:

1. 手順1
2. 手順2

## 次のステップ

- [関連ガイド](./related-guide.md)

````

---

## 5. ドキュメント更新ガイド

### 5.1 更新が必要な変更

以下のコード変更時は、ドキュメント更新が**必須**です：

| 変更内容                   | 影響を受けるドキュメント           |
| -------------------------- | ---------------------------------- |
| **型定義の追加・変更**     | `shared/types.md`、関連API仕様書   |
| **API仕様の変更**          | `api/endpoints.md`、リクエスト/レスポンス形式 |
| **新機能の追加**           | 概要ドキュメント、実装詳細         |
| **アーキテクチャの変更**   | `architecture/overview.md`など     |
| **公開インターフェースの変更** | 該当コンポーネント/サービスのドキュメント |
| **環境変数の追加・変更**   | `deployment/environment-variables.md` |
| **新しい評価エージェント** | `architecture/`, `backend/agents/` |

### 5.2 更新不要な変更

以下の変更では、通常ドキュメント更新は**不要**です：

- **内部実装の改善**: リファクタリング、パフォーマンス最適化
- **バグフィックス**: 挙動が変わらないバグ修正
- **テストコードの変更**: テストの追加・修正
- **CI/CD設定の微調整**: ビルド設定の調整
- **コメントやフォーマットの変更**: コード内コメント、インデント修正

### 5.3 .docsignore の管理

`.docsignore`ファイルは、ドキュメント更新チェックから除外するファイルパターンを定義します。

#### 現在の除外パターン

<!-- CODE_REF: .docsignore:1-48 -->

```gitignore
# 依存関係とビルド成果物
node_modules/
dist/
build/
coverage/

# ログファイル
logs/
**/*.log
**/debug-*.json

# テストファイル
**/*.test.ts
**/*.test.tsx
**/test-setup.ts

# 設定ファイル
**/*.config.js
**/*.config.ts
.eslintrc*
.prettierrc*
tsconfig*.json
jest.config.js

# 環境変数ファイル
.env
.env.*
!.env.example

# システムファイル
.DS_Store
.vscode/
.idea/

# パッケージマネージャー関連
package-lock.json
yarn.lock
pnpm-lock.yaml

# その他
*.min.js
*.map
manifest.json
````

#### 新しいパターンの追加

ドキュメント更新が不要なファイルタイプを追加する場合：

```gitignore
# 理由: [なぜ除外するか]
path/to/exclude/
**/*.extension
```

### 5.4 /update-docs コマンドの使用

`/update-docs`
コマンドは、コード変更に応じてドキュメントを自動的に更新するClaude
Code専用コマンドです。

#### 実行タイミング

- コードの変更後
- Pull Request作成前
- 定期的なドキュメントメンテナンス時

#### 実行手順

<!-- CODE_REF: .claude/commands/update-docs.md:9-62 -->

1. **ドキュメント検証を実行**

   ```bash
   npm run validate:docs:update
   ```

   変更されたファイルのリストを取得

2. **変更内容を分析**

   ```bash
   git diff main...HEAD
   ```

   または

   ```bash
   git diff HEAD~10
   ```

   各ファイルの具体的な変更内容を確認

3. **ドキュメント更新が必要な変更を判断**
   - [5.1 更新が必要な変更](#51-更新が必要な変更)の基準に照らし合わせる

4. **更新対象ドキュメントを特定**
   - `docs/api/` - API仕様
   - `docs/architecture/` - アーキテクチャ
   - `docs/backend/` - バックエンド
   - `docs/deployment/` - デプロイルール
   - `docs/development/` - 開発ルール
   - `docs/figma-plugin/` - プラグイン
   - `docs/shared/` - 共通処理
   - `CLAUDE.md` - 重要な設計方針（稀）

5. **ドキュメントを更新**
   - 変更内容を反映
   - CODE_REFコメントの行番号を確認
   - 例やサンプルコードを更新

6. **検証**

   ```bash
   npm run validate:docs
   ```

7. **結果をユーザーに報告**

#### 出力形式

<!-- CODE_REF: .claude/commands/update-docs.md:65-84 -->

```markdown
## 完了しました！

### 📝 更新したドキュメント

#### 1. [ファイル名] (+X行, -Y行)

- 変更内容1
- 変更内容2

### 🔍 調査結果

[主な変更内容の説明]

### 次のステップ

変更内容を確認して、必要に応じてコミットしてください: `git status`
```

---

## 6. クロスリファレンス

### 6.1 リンクの書き方

#### 相対パスリンク（推奨）

**同じディレクトリ**:

```markdown
[関連ドキュメント](./related-doc.md)
```

**親ディレクトリ**:

```markdown
[上位ドキュメント](../parent-doc.md)
```

**別カテゴリ**:

```markdown
[API仕様](../api/endpoints.md) [アーキテクチャ](../architecture/overview.md)
```

#### アンカーリンク

```markdown
[セクション1へジャンプ](#セクション1) [詳細説明へ](#31-詳細説明)
```

**ルール**:

- 見出しテキストをそのまま使用
- スペースは`-`に置換されない（日本語の場合）
- 英数字見出しの場合は小文字化・スペース→ハイフン

#### 外部リンク

```markdown
[Figma Plugin API](https://www.figma.com/plugin-docs/)
[Claude API](https://docs.anthropic.com/claude/reference)
```

### 6.2 関連ドキュメントの管理

#### "次のステップ" セクション

すべての主要ドキュメントの最後に配置：

```markdown
## 次のステップ

- [関連トピック1](./related1.md) - トピック1の詳細
- [関連トピック2](../other/related2.md) - トピック2の実装
- [発展的な内容](./advanced.md) - より高度な使い方
```

**選定基準**:

- 読者が次に読むべき自然な流れ
- 現在のドキュメントを理解した上で役立つ内容
- 3〜5個程度（多すぎない）

#### LLM検索マッピングテーブル

`docs/README.md`に配置されているマッピングテーブル：

<!-- CODE_REF: docs/README.md:89-103 -->

```markdown
## 🔍 LLM向け検索マッピング

| 質問の種類                             | 参照すべきドキュメント                                  |
| -------------------------------------- | ------------------------------------------------------- |
| 「新しい評価エージェントを追加したい」 | [architecture/agent-system.md](./architecture/), ...    |
| 「APIエンドポイントの仕様は?」         | [api/endpoints.md](./api/), ...                         |
| 「Figmaデータはどう抽出される?」       | [figma-plugin/data-extraction.md](./figma-plugin/), ... |
```

**新しいマッピングの追加**:

1. よくある質問を特定
2. その質問に答えるドキュメントをリストアップ
3. テーブルに行を追加

---

## 7. ベストプラクティス

### 7.1 可読性

#### 適切な見出し階層

**良い例**:

```markdown
# ドキュメントタイトル

## 主要セクション1

### サブセクション1-1

内容...

### サブセクション1-2

内容...

## 主要セクション2
```

**悪い例**:

```markdown
# ドキュメントタイトル

### セクション1（H2をスキップ）

##### サブセクション（H3,H4をスキップ）
```

#### 短い段落

- 1段落は3〜5文程度
- 長い説明は箇条書きに分割
- 視覚的な区切りを意識

**良い例**:

```markdown
このシステムは3つのコンポーネントで構成されています。

各コンポーネントの役割：

- コンポーネントA: データ抽出
- コンポーネントB: データ処理
- コンポーネントC: 結果表示
```

#### 具体例の提供

抽象的な説明だけでなく、必ず具体例を含める：

**良い例**:

````markdown
環境変数は`.env`ファイルで管理します。

例:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
PORT=3000
```
````

`````

### 7.2 保守性

#### CODE_REFの積極的使用

重要なコードスニペットには必ずCODE_REFを付ける：

**良い例**:
````markdown
<!-- CODE_REF: backend/src/services/evaluation.service.ts:38-50 -->

```typescript
async evaluateDesign(...) {
  // コード
}
`````

`````

**悪い例**:
````markdown
```typescript
async evaluateDesign(...) {
  // CODE_REFなし - どのファイルか不明
}
```
`````

#### 定期的な検証

```bash
# コミット前に必ず実行
npm run validate:docs
```

#### 更新チェックリストの活用

コード変更時は[5.1 更新が必要な変更](#51-更新が必要な変更)を確認

### 7.3 検索性（LLM向け）

#### キーワードの選定

- 自然言語での質問形式を想定
- 技術用語を適切に使用
- 同義語も考慮

**例**:

```markdown
# エージェント追加ガイド

<!-- "新しい評価エージェント" "エージェント実装" などでも検索可能 -->

このガイドでは、新しい評価エージェントを追加する方法を説明します。
```

#### 質問形式での見出し

```markdown
## どのようにエージェントを追加するか？

## エラーが発生した場合の対処法
```

#### 用語の統一

同じ概念には常に同じ用語を使用：

| 統一用語         | 避けるべき表記           |
| ---------------- | ------------------------ |
| 評価エージェント | エージェント/評価クラス  |
| Figmaプラグイン  | プラグイン/Figmaアドオン |
| Claude API       | Anthropic API/Claude     |
| ノードデータ     | Figmaノード/ノード情報   |

---

## 8. AI（Claude Code）向け特記事項

### 8.1 ドキュメント作成時

#### 必須事項

1. **CODE_REFの使用**: すべてのコードスニペットに付与
2. **検証コマンドの実行**: 作成後に`npm run validate:docs`を実行
3. **既存パターンの遵守**: 同カテゴリの既存ドキュメントを参考に

#### 推奨事項

- 具体例を豊富に含める
- テーブルを活用して情報を整理
- "次のステップ"セクションを必ず追加

### 8.2 ドキュメント更新時

#### 実行手順

1. **git diffの確認**

   ```bash
   git diff main...HEAD
   ```

   または

   ```bash
   git diff HEAD~10
   ```

2. **更新判断基準の適用**
   - [5.1 更新が必要な変更](#51-更新が必要な変更)に該当するか確認

3. **関連ドキュメントの同時更新**
   - 1つのファイル変更が複数のドキュメントに影響する場合あり
   - docs/README.md:140-150の対応表を参照

<!-- CODE_REF: docs/README.md:140-150 -->

#### 更新対象の特定

| ファイル                                     | 更新が必要なドキュメント                                               |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `backend/src/services/agents/base.agent.ts`  | `architecture/agent-system.md`, `backend/agents/base-agent.md`         |
| `backend/src/services/evaluation.service.ts` | `architecture/data-flow.md`, `backend/services.md`, `api/endpoints.md` |
| `backend/src/routes/evaluation.ts`           | `api/endpoints.md`, `api/request-response.md`                          |
| `shared/src/types.ts`                        | `shared/types.md`, `api/request-response.md`                           |

### 8.3 /update-docs コマンド実行時

#### 段階的な実行手順

<!-- CODE_REF: .claude/commands/update-docs.md:9-62 -->

1. `npm run validate:docs:update` を実行
2. `git diff` で変更内容を確認
3. 更新が必要な変更かを判断
4. 更新対象ドキュメントを特定
5. ドキュメントを更新
6. `npm run validate:docs` で検証
7. ユーザーに結果を報告

#### 出力形式の遵守

必ず以下の形式で結果を報告：

```markdown
## 完了しました！

### 📝 更新したドキュメント

#### 1. docs/api/endpoints.md (+15行, -8行)

- リクエストスキーマにplatformType追加
- レスポンス例を更新

#### 2. docs/shared/types.md (+5行, -0行)

- PlatformType型定義を追加

### 🔍 調査結果

shared/src/types.tsにPlatformType型が追加され、API仕様に影響しています。

### 次のステップ

変更内容を確認して、必要に応じてコミットしてください: `git status`
```

#### サマリーの作成

- 何を変更したか明確に記載
- 変更理由を簡潔に説明
- 次のアクションを提示

---

## 9. 検証とメンテナンス

### 9.1 自動検証

#### 検証コマンド

<!-- CODE_REF: scripts/validate-docs.ts:1-83 -->

```bash
# 全検証（CODE_REF + ドキュメント更新確認）
npm run validate:docs

# CODE_REF検証のみ
npm run validate:docs:code

# ドキュメント更新確認のみ
npm run validate:docs:update
```

#### package.json スクリプト

```json
{
  "scripts": {
    "validate:docs": "tsx scripts/validate-docs.ts",
    "validate:docs:code": "tsx scripts/validate-docs-code.ts",
    "validate:docs:update": "tsx scripts/validate-docs-update.ts"
  }
}
```

#### 検証の詳細モード

```bash
npm run validate:docs -- --verbose
```

### 9.2 手動レビュー

#### リリース前チェック

Pull Request作成時：

- [ ] `npm run validate:docs` が成功
- [ ] 新しいドキュメントがREADMEに追加されている
- [ ] CODE_REFが正しい行番号を指している
- [ ] リンク切れがない
- [ ] 誤字脱字がない

#### 四半期レビュー

3ヶ月に1度：

- [ ] 古くなった情報の更新
- [ ] 不要になったドキュメントの削除
- [ ] 新しいベストプラクティスの追加
- [ ] .docsignoreの見直し

### 9.3 継続的改善

#### ガイドライン自体の更新

このガイドラインも進化します：

- 新しいパターンが確立された場合
- より良い方法が見つかった場合
- フィードバックを受けた場合

#### フィードバックの収集

- チームメンバーからの改善提案
- ドキュメント作成時の困難点
- 検証エラーの傾向分析

---

## 付録

### A. よくある質問（FAQ）

**Q1: CODE_REFの行番号がずれてしまいました。どうすれば良いですか？**

A1: 以下の手順で修正してください：

1. 該当ファイルを開いて正しい行番号を確認
2. ドキュメント内のCODE_REFを更新
3. `npm run validate:docs`で検証

**Q2: 新しいカテゴリを追加したい場合は？**

A2: 以下の手順で追加してください：

1. `docs/`直下に新しいディレクトリを作成
2. そのディレクトリに`README.md`を作成（[1.3 README.mdの役割](#13-readmemd-の役割)参照）
3. `docs/README.md`のナビゲーションセクションに追加
4. `docs/README.md`のLLM検索マッピングテーブルに追加

**Q3: ドキュメントが多すぎて更新が大変です**

A3: 以下の対策を検討してください：

- CODE_REFシステムを活用して自動検証
- `/update-docs`コマンドを定期的に実行
- 優先度の高いドキュメントから更新
- .docsignoreを適切に設定

**Q4: 英語のドキュメントも必要ですか？**

A4: 現在のガイドラインでは日本語のみです。国際化が必要になった場合は、別途検討します。

### B. トラブルシューティング

#### 問題1: CODE_REF検証でエラーが大量に出る

**原因**: コードの大規模なリファクタリングや移動

**解決策**:

1. `git log`で最近の変更を確認
2. ファイル移動の場合: 全てのCODE_REFのパスを更新
3. コード削除の場合: 該当セクションをドキュメントから削除
4. 行番号ずれの場合: 各CODE_REFを個別に修正

#### 問題2: ドキュメント更新チェックで誤検知される

**原因**: .docsignoreに適切なパターンが設定されていない

**解決策**:

1. `.docsignore`を開く
2. 除外すべきファイルパターンを追加
3. コメントで除外理由を記載

#### 問題3: リンク切れが発生する

**原因**: ファイル名変更やディレクトリ移動

**解決策**:

1. `grep -r "old-filename.md" docs/`で全参照を検索
2. 全てのリンクを新しいパスに更新
3. アンカーリンクも確認

### C. 用語集

| 用語                   | 説明                                                       |
| ---------------------- | ---------------------------------------------------------- |
| **CODE_REF**           | コードスニペットが参照する実際のコードの場所を示すコメント |
| **クロスリファレンス** | ドキュメント間の相互参照リンク                             |
| **LLM検索マッピング**  | AIが効率的に情報を見つけるための質問-ドキュメント対応表    |
| **.docsignore**        | ドキュメント更新チェックから除外するファイルパターン       |
| **/update-docs**       | Claude Codeによる自動ドキュメント更新コマンド              |
| **ケバブケース**       | lowercase-with-hyphens形式のファイル命名規則               |
| **相対パスリンク**     | 現在のファイルからの相対位置で指定するリンク               |

### D. テンプレート集

詳細は[4.3 ドキュメントテンプレート](#43-ドキュメントテンプレート)を参照してください。

利用可能なテンプレート：

1. 概要ドキュメント
2. API仕様書
3. 実装詳細
4. ハウツーガイド

---

## 🔗 関連ドキュメント

- [プロジェクト概要（CLAUDE.md）](../../CLAUDE.md)
- [docs/ディレクトリ全体の説明](../README.md)
- [開発環境セットアップ](./getting-started.md)
- [開発コマンドリファレンス](./commands.md)
