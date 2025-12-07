# 共通型定義ドキュメント

このディレクトリには、フロントエンドとバックエンド間で共有される型定義に関するドキュメントが含まれます。

## 📚 ドキュメント一覧

### 計画中のドキュメント

- **types.md** - 共通型定義の詳細説明、使用例
  - FigmaNodeType - Figmaノードタイプの列挙型（40種類）
  - FigmaNodeData - Figmaノードデータの型
  - FigmaStylesData - Figmaスタイル情報の型
  - EvaluationResult - 評価結果の型
  - Issue - 問題項目の型
  - Suggestion - 改善提案の型
  - CategoryResult - カテゴリ別評価結果の型
  - ScreenshotData - スクリーンショットデータの型

## 🎯 このカテゴリの目的

型安全性を確保するための共通型定義を理解し、正しく使用するための情報を提供します。API連携やデータ構造の理解時に参照してください。

## 🔥 主要な型定義

<!-- CODE_REF: shared/src/types.ts:7-43 -->

### FigmaNodeType

Figmaの全ノードタイプを厳密に定義した列挙型です。従来の`string`型から移行し、型安全性が大幅に向上しました。

```typescript
export type FigmaNodeType =
  | 'BOOLEAN_OPERATION'
  | 'CODE_BLOCK'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'CONNECTOR'
  | 'DOCUMENT'
  | 'ELLIPSE'
  | 'EMBED'
  | 'FRAME'
  | 'GROUP'
  | 'HIGHLIGHT'
  | 'INSTANCE'
  // ... 他28種類
  | 'WIDGET';
```

**利点:**

- コンパイル時に無効なノードタイプを検出
- IDEの自動補完で全40種類のノードタイプを表示
- Zodバリデーションで実行時の型チェックも可能

**使用箇所:**

- `FigmaNodeData.type`
- `SelectedLayer.type`
- バックエンドの`figmaNodeTypeSchema`

---

<!-- CODE_REF: shared/src/types.ts:234-248 -->

### ScreenshotData

スクリーンショットデータは、Claude APIのVision機能を使用した視覚的評価に使用されます。

```typescript
export interface ScreenshotData {
  /** Base64エンコードされた画像データ（data:image/png;base64,... 形式） */
  imageData: string;
  /** 元のノード名（サニタイズ前） */
  nodeName: string;
  /** 元のノードID */
  nodeId: string;
  /** 画像のバイトサイズ */
  byteSize: number;
}
```

**用途:**
- Figmaノードのスクリーンショットをキャプチャしてバックエンドに送信
- Claude APIのVision機能を使用した視覚的デザイン評価
- 特にユーザビリティ評価で視覚的レイアウトの分析に活用

**特徴:**
- PNG形式、0.5倍解像度でキャプチャ
- Base64エンコードで送信
- 開発環境ではログとして保存（`backend/logs/screenshots/`）

## 🔗 関連ドキュメント

- [API仕様](../backend/api.md) - APIリクエスト/レスポンスの型
- [バックエンド実装](../backend/) - 型の使用例
- [フロントエンド実装](../figma-plugin/) - 型の使用例
