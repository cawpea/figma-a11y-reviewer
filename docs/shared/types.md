# 共通型定義

このドキュメントでは、フロントエンドとバックエンド間で共有される型定義の詳細を説明します。

## Issue型 - 評価問題の型定義

<!-- CODE_REF: shared/src/types.ts:180-208 -->

`Issue`型は、各評価エージェントが検出した問題を表現する型です。

```typescript
export interface Issue {
  severity: 'high' | 'medium' | 'low';
  message: string;
  nodeId?: string;
  nodeIds?: string[];
  nodeHierarchy?: string[];
  autoFixable: boolean;
  suggestion?: string;
}
```

### フィールド詳細

#### `severity`: 問題の重要度

問題の優先度を3段階で表現します。

- **`high`**: 重大な問題（WCAGコントラスト比不合格、重要な表記揺れなど）
- **`medium`**: 中程度の問題（スタイル不一致、推奨されない実装など）
- **`low`**: 軽微な問題（改善提案レベル）

**使用箇所**:

- フロントエンドで問題の色分け表示に使用
- バックエンドでソート順決定（high → medium → low）

#### `message`: 問題の説明

具体的な問題内容を日本語で記述します。

**記載例**:

- 「背景色 #F5F5F5 とテキスト #999999 のコントラスト比は 2.8:1 で、4.5:1 の基準を満たしていません」
- 「ボタンの背景色がColorStyleを使用せずハードコードされています」

**注意**:

- Figma ID（例: `1809:1836`）は含めない（別途`nodeId`/`nodeIds`で管理）
- ユーザーが理解しやすい具体的な説明を心がける

#### `nodeId`: 単一ノードのFigma ID（非推奨）

**@deprecated**: 新しいコードでは`nodeIds`配列を使用してください。

単一ノードに関する問題の場合のFigma IDです。後方互換性のために残されています。

**形式**:

- 通常ノード: `"1809:1836"`
- インスタンスノード: `"I1806:932;589:1207"`
- ネストされたインスタンス: `"I1806:984;1809:902;105:1169"`

**優先順位**: `nodeIds`が存在する場合、`nodeIds`が優先されます。

#### `nodeIds`: 複数ノードのFigma ID配列（推奨）

**複数のノードに同じ問題がある場合**に使用する配列フィールドです。

**使用例**:

```typescript
{
  severity: 'high',
  message: '背景色 #F5F5F5 とテキスト #999999 のコントラスト比は 2.8:1 で、WCAG AA基準（4.5:1）を満たしていません',
  nodeIds: ['1809:1836', '1809:1850', '1809:1870'],
  autoFixable: false,
  suggestion: 'テキストカラーを #333333 に変更してください'
}
```

**利点**:

- 同じ問題を1つのIssueとしてまとめられる（UIがすっきり）
- フロントエンドで「選択」ボタンをクリックすると全ノードを一括選択
- LLMへのコンテキストサイズ削減

**フロントエンド表示**:

- `nodeIds`が複数ある場合、「3個の要素」バッジを表示
- 「選択」ボタンで全ノードを同時選択

**バックエンドでの生成方法**:

1. **カラーコントラストマップでグループ化**:
   `backend/src/utils/prompt.utils.ts`の`buildColorContrastMap()`関数が同じ色の組み合わせをグループ化
2. **LLMへの指示**: JSON
   schemaで「同じ問題が複数ノードにある場合はnodeIds配列を使用」と指示
3. **自動集約**: AccessibilityAgentなどが自動的に`nodeIds`配列を返す

#### `nodeHierarchy`: ノード階層パス

ノードが見つからない場合のフォールバック用の階層パス配列です。

**形式**: `[rootId, parentId, grandParentId, ..., nodeId]`

**例**: `["1234:5678", "1809:1800", "1809:1836"]`

**用途**:

- ノードが削除された場合、親ノードを段階的に選択
- `figma-plugin/src/main.ts`の`selectNodeWithFallback()`で使用

#### `autoFixable`: 自動修正可能性

この問題が自動修正可能かどうかを示すフラグです。

**現在の実装**:
UI上では使用されていませんが、将来的な自動修正機能の実装に備えて保持されています。

#### `suggestion`: 改善提案

問題の具体的な改善方法を記述します。

**記載例**:

- 「テキストカラーを #333333 に変更するか、背景を #FFFFFF に変更してください」
- 「Button/Primary ColorStyle を使用してください」

**注意**:

- Figma ID（例: `1809:1836`）は含めない
- 具体的な数値や色コードを含める

**フロントエンド表示**:

- 💡アイコン付きで黄色い背景のボックスで表示

---

## CategoryResult型 - カテゴリ別評価結果

<!-- CODE_REF: shared/src/types.ts:210-213 -->

各評価エージェントが返す結果の型です。

```typescript
export interface CategoryResult {
  issues: Issue[];
  positives?: string[];
}
```

### フィールド詳細

#### `issues`: 検出された問題の配列

エージェントが検出した全ての問題を`Issue`型の配列として保持します。

**バックエンドでの処理**:

- 各エージェント（AccessibilityAgent、StyleConsistencyAgentなど）が`issues`配列を返す
- `evaluation.service.ts`で全エージェントの`issues`を収集してソート

#### `positives`: 良い点の配列（オプション）

デザインの良い点を文字列配列で保持します。

**使用例**:

- 「カラーコントラスト比が基準を満たしています」
- 「適切なコンポーネント構造になっています」

**フロントエンド表示**:

- 「Good 👍」セクションで表示

---

## Suggestion型 - 改善提案

<!-- CODE_REF: shared/src/types.ts:215-217 -->

全エージェントの`Issue`をカテゴリ情報付きで統合した型です。

```typescript
export interface Suggestion extends Issue {
  category: string;
}
```

### フィールド詳細

#### `category`: エージェントカテゴリ

問題を検出したエージェントのタイプを示します。

**現在利用可能な値**:

- `"accessibility"`: AccessibilityAgent（WCAG 2.2 AA準拠、色のコントラスト、タッチターゲットサイズ）

**用途**:

- 問題の出典を追跡
- カテゴリ別のフィルタリング（将来的な実装）

---

## EvaluationResult型 - 評価結果全体

<!-- CODE_REF: shared/src/types.ts:219-232 -->

バックエンドAPIが返す最終的な評価結果の型です。

```typescript
export interface EvaluationResult {
  categories: {
    [key: string]: CategoryResult;
  };
  suggestions: Suggestion[];
  metadata: {
    evaluatedAt: Date;
    duration: number;
    rootNodeId: string;
    usage?: TokenUsage;
  };
}
```

### フィールド詳細

#### `categories`: カテゴリ別評価結果

エージェントタイプをキー、`CategoryResult`を値とするオブジェクトです。

**例**:

```typescript
{
  "accessibility": {
    "issues": [...],
    "positives": [...]
  }
}
```

#### `suggestions`: ソート済み全提案

全エージェントの`Issue`を重要度順にソートした配列です。

**ソート順**: `high` → `medium` → `low`

**用途**:

- 優先度順に問題を表示
- カテゴリ横断的な問題把握

#### `metadata`: メタデータ

評価に関するメタ情報を保持します。

**サブフィールド**:

- `evaluatedAt`: 評価実行日時（Date型）
- `duration`: 評価にかかった時間（ミリ秒）
- `rootNodeId`: 評価対象のルートノードID（フォールバック用）
- `usage`: トークン使用量と推定コスト（オプション）

---

## FigmaNodeData型 - Figmaノードデータ

<!-- CODE_REF: shared/src/types.ts:44-92 -->

Figmaプラグインから送信されるノード情報の型です。

```typescript
export interface FigmaNodeData {
  id: string;
  name: string;
  type: FigmaNodeType;
  visible: boolean;
  locked: boolean;
  // ... 多数のフィールド
}
```

### 主要フィールド

- `id`: Figma node ID
- `name`: ノード名
- `type`: FigmaNodeType（40種類の厳密な型定義）
- `visible`: 表示/非表示
- `locked`: ロック状態
- `children`: 子ノード配列（ネスト構造）
- `fills`: 塗りつぶし情報
- `strokes`: 線情報
- `effects`: エフェクト情報

**詳細**: 全フィールドの説明は`shared/src/types.ts`を参照してください。

---

## FigmaStylesData型 - Figmaスタイル情報

<!-- CODE_REF: shared/src/types.ts:155-178 -->

Figmaファイル全体のスタイル情報（Variables、TextStyles、ColorStyles、EffectStyles）を保持する型です。

```typescript
export interface FigmaStylesData {
  variables?: VariableInfo[];
  textStyles?: TextStyleInfo[];
  colorStyles?: ColorStyleInfo[];
  effectStyles?: EffectStyleInfo[];
  metadata: {
    truncated: boolean;
  };
}
```

### 用途

StyleConsistencyAgentがハードコードされた色やスタイルの不一致を検出する際に使用します。

**制限**: 各カテゴリ最大100件（`STYLES_LIMIT.MAX_ITEMS_PER_CATEGORY`）

---

## ScreenshotData型 - スクリーンショットデータ

<!-- CODE_REF: shared/src/types.ts:234-248 -->

Claude APIのVision機能を使用した視覚的評価用のスクリーンショットデータです。

```typescript
export interface ScreenshotData {
  imageData: string;
  nodeName: string;
  nodeId: string;
  byteSize: number;
}
```

### 用途

- Figmaノードのスクリーンショットをキャプチャしてバックエンドに送信
- Claude APIのVision機能を使用した視覚的デザイン評価
- 特にUsabilityAgentで視覚的レイアウトの分析に活用

**詳細**:
[バックエンドAPI仕様](../backend/api.md#post-apievaluate)を参照してください。

---

## 型定義の使用例

### バックエンド: Issue生成

```typescript
// AccessibilityAgent での Issue 生成例
const issue: Issue = {
  severity: 'high',
  message:
    '背景色 #F5F5F5 とテキスト #999999 のコントラスト比は 2.8:1 で、WCAG AA基準（4.5:1）を満たしていません',
  nodeIds: ['1809:1836', '1809:1850', '1809:1870'], // 複数ノードをグループ化
  autoFixable: false,
  suggestion: 'テキストカラーを #333333 に変更してください',
};
```

### フロントエンド: Issue表示

```typescript
// IssueItem コンポーネントでの使用例
const nodeCount = issue.nodeIds ? issue.nodeIds.length : issue.nodeId ? 1 : 0;

// 複数ノードの場合はバッジを表示
{nodeCount > 1 && (
  <Badge severity="neutral" label={`${nodeCount}個の要素`} />
)}
```

### フロントエンド: 複数ノード選択

```typescript
// useEvaluation フックでの使用例
const targetNodeIds =
  issue.nodeIds && issue.nodeIds.length > 0
    ? issue.nodeIds
    : issue.nodeId
      ? [issue.nodeId]
      : rootNodeId
        ? [rootNodeId]
        : [];

emit('SELECT_NODE', { nodeIds: targetNodeIds });
```

---

## 関連ドキュメント

- [バックエンドAPI仕様](../backend/api.md) - APIリクエスト/レスポンスの型
- [アーキテクチャ概要](../architecture/overview.md) - システム全体のデータフロー
- [Figmaプラグイン実装](../figma-plugin/) - フロントエンド側の型使用例
