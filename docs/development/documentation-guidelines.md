# ドキュメンテーションガイドライン

このドキュメントは、本プロジェクトのドキュメント作成・更新の統一ルールを定めたものです。

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

### 1.1 ドキュメント構成

- `docs/api/` - API仕様
- `docs/architecture/` - アーキテクチャ
- `docs/backend/` - バックエンド
- `docs/deployment/` - デプロイルール
- `docs/development/` - 日常的な開発ルール
- `docs/figma-plugin/` - プラグイン
- `docs/shared/` - 共通処理
- `CLAUDE.md` - 重要な設計方針

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

## 2. CODE_REFシステム

### 2.1 基本形式

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

### 2.2 使用例

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

### 2.3 検証方法

#### 自動検証コマンド

```bash
# 全検証（CODE_REF + ドキュメント更新確認）
npm run validate:docs

# CODE_REF検証のみ
npm run validate:docs:code

# ドキュメント更新確認のみ
npm run validate:docs:update
```

## 3. 新規ドキュメント作成ガイド

### 3.1 作成前のチェックリスト

新しいドキュメントを作成する前に、以下を確認してください：

- [ ] **既存ドキュメントの確認**: 同様の内容が既に存在しないか
- [ ] **カテゴリの選定**: 適切なディレクトリ（architecture/api/backend/etc.）
- [ ] **ファイル名の決定**: ケバブケースで明確な名前
- [ ] **関連ドキュメントの特定**: クロスリファレンス先のリストアップ
- [ ] **CODE_REF対象の特定**: 参照すべきコードの場所

### 3.2 作成ステップ

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

### 3.3 ドキュメントテンプレート

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

```typescript
// 主要な処理の例
```

## 次のステップ

- [詳細ドキュメント1](./detail1.md)
- [詳細ドキュメント2](./detail2.md)
````

#### テンプレート2: API仕様書

````markdown
# [API名] 仕様

このドキュメントでは、[API名]のエンドポイント仕様を説明します。

## ベースURL

- **開発環境**: `http://localhost:3000`
- **本番環境**: `https://api.example.com`

## エンドポイント一覧

| メソッド | パス        | 説明   | 認証 |
| -------- | ----------- | ------ | ---- |
| POST     | `/api/path` | [説明] | 必要 |
| GET      | `/api/path` | [説明] | 不要 |

---

## POST /api/path

[エンドポイントの詳細説明]

### リクエスト

#### Headers

```
Content-Type: application/json Authorization: Bearer <token>
```

#### Body

```html
<!-- CODE_REF: backend/src/routes/your-route.ts:10-30 -->
```

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

````markdown
# [機能名] 実装詳細

このドキュメントでは、[機能名]の実装の詳細を説明します。

## 概要

[機能の簡潔な説明]

## 実装ファイル

| ファイル           | 責務   |
| ------------------ | ------ |
| `path/to/file1.ts` | [責務] |
| `path/to/file2.ts` | [責務] |

## 主要クラス/関数

### ClassName

```html
<!-- CODE_REF: path/to/your-file.ts:10-50 -->
```

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

````markdown
# [タスク名] ガイド

このドキュメントでは、[タスク名]の手順を説明します。

## 前提条件

- 条件1
- 条件2

## 手順

### 1. [ステップ1の説明]

```bash
command-here
```

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

## 4. ドキュメント更新ガイド

### 4.1 更新が必要な変更

以下のコード変更時は、ドキュメント更新が**必須**です：

| 変更内容                       | 影響を受けるドキュメント                      |
| ------------------------------ | --------------------------------------------- |
| **型定義の追加・変更**         | `shared/types.md`、関連API仕様書              |
| **API仕様の変更**              | `api/endpoints.md`、リクエスト/レスポンス形式 |
| **新機能の追加**               | 概要ドキュメント、実装詳細                    |
| **アーキテクチャの変更**       | `architecture/overview.md`など                |
| **公開インターフェースの変更** | 該当コンポーネント/サービスのドキュメント     |
| **環境変数の追加・変更**       | `deployment/environment-variables.md`         |
| **新しい評価エージェント**     | `architecture/`, `backend/agents/`            |

### 4.2 更新不要な変更

以下の変更では、通常ドキュメント更新は**不要**です：

- **内部実装の改善**: リファクタリング、パフォーマンス最適化
- **バグフィックス**: 挙動が変わらないバグ修正
- **テストコードの変更**: テストの追加・修正
- **CI/CD設定の微調整**: ビルド設定の調整
- **コメントやフォーマットの変更**: コード内コメント、インデント修正

### 4.3 更新方法

- 変更内容を反映した適切な説明を追加
- １つのドキュメントが1000文字以上に達する場合はドキュメントを分割
- ドキュメントを分割した場合は、分割内容をもとにREADME.mdも更新
- CODE_REF コメントが正しい行番号を指しているか確認
- 例やサンプルコードを更新
- リンクされている関連ドキュメントを更新

### 4.4 .docsignore の管理

`.docsignore`ファイルは、ドキュメント更新チェックから除外するファイルパターンを定義します。

### 4.5 /update-docs コマンドの使用

`/update-docs`
コマンドは、コード変更に応じてドキュメントを自動的に更新するClaude
Code専用コマンドです。

#### 実行タイミング

- コードの変更後
- Pull Requestのレビュー依頼前
- 定期的なドキュメントメンテナンス時

## 5. クロスリファレンス

### 5.1 リンクの書き方

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

---

## 6. ベストプラクティス

- 適切な見出し階層で構成する
- 1段落は3〜5文程度
- 長い説明は箇条書きに分割
- 視覚的な区切りを意識
- 抽象的な説明だけでなく、必ず具体例を含める
- 同じ概念には常に同じ用語を使用
- 重要なコードスニペットには必ずCODE_REFを付ける
- コード変更時は「4.1 更新が必要な変更」を確認
