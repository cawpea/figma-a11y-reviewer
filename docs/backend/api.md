# API Endpoints

> **注**: このファイルは旧 `docs/api/endpoints.md` から移動されました。

このドキュメントでは、Figma A11y
Reviewer バックエンドAPIのエンドポイント仕様を説明します。

## ベースURL

- **開発環境**: `http://localhost:3000`
- **本番環境**: （デプロイ先に応じて設定）

## エンドポイント一覧

| メソッド | パス            | 説明                | 認証 |
| -------- | --------------- | ------------------- | ---- |
| POST     | `/api/evaluate` | Figmaデザインを評価 | 不要 |
| GET      | `/api/health`   | ヘルスチェック      | 不要 |

---

## POST /api/evaluate

Figmaデザインを指定された評価エージェントで評価し、結果を返します。

### リクエスト

#### Headers

```
Content-Type: application/json
```

#### Body

<!-- CODE_REF: backend/src/routes/evaluation.ts:24-62 -->

```typescript
{
  // 必須フィールド
  "fileKey": string,              // FigmaファイルのキーID
  "nodeId": string,               // 評価対象ノードのID（例: "1809:1836"）
  "nodeData": {                   // Figmaノードデータ（再帰的に抽出）
    "id": string,
    "name": string,
    "type": FigmaNodeType,        // 厳密な型定義（40種類のFigmaノードタイプ）
    // ... その他のプロパティ（figma.utils.tsで抽出）
  },

  // オプションフィールド
  "stylesData": {                 // ファイル全体のスタイル定義
    "variables": Array<{
      "id": string,
      "name": string,
      "resolvedType": string,
      "valuesByMode"?: Record<string, unknown>
    }>,
    "textStyles": Array<{
      "id": string,
      "name": string,
      "description"?: string
    }>,
    "colorStyles": Array<{
      "id": string,
      "name": string,
      "description"?: string
    }>,
    "effectStyles": Array<{
      "id": string,
      "name": string,
      "description"?: string
    }>,
    "meta": {
      "variablesCount": number,
      "textStylesCount": number,
      "colorStylesCount": number,
      "effectStylesCount": number,
      "truncated": boolean          // 100個制限で切り捨てられた場合true
    }
  },
  "evaluationTypes": string[],      // 実行するエージェント（省略時は全て実行）
                                     // 現在は ["accessibility"] のみ利用可能
  "userId": string,                  // 分析用のユーザーID（オプション）
  "screenshot": {                    // スクリーンショットデータ（オプション）
    "imageData": string,             // Base64エンコードされた画像データ（data:image/png;base64,... 形式）
    "nodeName": string,              // 元のノード名（サニタイズ前）
    "nodeId": string,                // 元のノードID
    "byteSize": number               // 画像のバイトサイズ
  }
}
```

#### evaluationTypes の指定可能な値

| 値                  | 説明                                       | 推定実行時間 |
| ------------------- | ------------------------------------------ | ------------ |
| `accessibility-a`   | アクセシビリティ評価（WCAG 2.2 Level A）   | ~15秒        |
| `accessibility-aa`  | アクセシビリティ評価（WCAG 2.2 Level AA）  | ~15秒        |
| `accessibility-aaa` | アクセシビリティ評価（WCAG 2.2 Level AAA） | ~15秒        |

**注**:

- 現在のシステムはアクセシビリティ評価専用です。
- FigmaプラグインのUIでWCAG適合レベル（A/AA/AAA）を選択すると、対応するevaluationTypeが自動的に送信されます。
- 省略時のデフォルト動作は実装により異なります（通常はAAレベル）。

#### スクリーンショット機能

`screenshot`フィールドを指定すると、Claude Vision
APIを使用して視覚的な評価が可能になります。

**特徴:**

- Figmaノードから自動的にキャプチャされたスクリーンショット（PNG形式、0.5倍解像度）
- Base64エンコードされた画像データとして送信
- 開発環境では`backend/logs/screenshots/`に自動保存（7日後に自動削除）

**制約:**

- 画像サイズ制限: 1MB以下（超過した場合はスクリーンショットなしで評価実行）
- スクリーンショットの取得に失敗しても評価は継続（nullの場合は送信されない）

**アクセシビリティ評価での活用:**

- **Level
  AA/AAA**: 視覚的なカラーコントラストの確認（背景パターン、グラデーション、画像上のテキストなど）
- **Level A/AA**: タッチターゲットの視覚的なサイズ確認
- **全レベル共通**: 情報の階層と構造の視覚的評価、計算に含まれない視覚的要素の検証

スクリーンショットが提供された場合、各アクセシビリティエージェント（`accessibility-a`/`accessibility-aa`/`accessibility-aaa`）では画像からの視覚的分析を優先し、Figmaノードデータと照合して具体的な問題点を特定します。

#### リクエスト例

```json
{
  "fileKey": "abc123def456",
  "nodeId": "1809:1836",
  "nodeData": {
    "id": "1809:1836",
    "name": "Login Screen",
    "type": "FRAME",
    "width": 375,
    "height": 812,
    "children": [
      {
        "id": "1809:1837",
        "name": "Email Input",
        "type": "FRAME",
        "fills": [
          {
            "type": "SOLID",
            "color": { "r": 1, "g": 1, "b": 1 }
          }
        ]
      }
    ]
  },
  "stylesData": {
    "variables": [],
    "textStyles": [
      {
        "id": "S:1234",
        "name": "Heading/Large",
        "description": "Main heading style"
      }
    ],
    "colorStyles": [],
    "effectStyles": [],
    "meta": {
      "variablesCount": 0,
      "textStylesCount": 1,
      "colorStylesCount": 0,
      "effectStylesCount": 0,
      "truncated": false
    }
  },
  "evaluationTypes": ["accessibility-aa"],
  "userId": "user-12345"
}
```

### レスポンス

#### 成功時（200 OK）

<!-- CODE_REF: backend/src/routes/evaluation.ts:90-100 -->

```typescript
{
  "success": true,
  "data": {
    "overallScore": number,           // 総合スコア（0-100）
    "categories": {
      "accessibility-aa": {           // 選択されたWCAGレベルに応じて変わる（accessibility-a/accessibility-aa/accessibility-aaa）
        "score": number,              // カテゴリスコア（0-100）
        "issues": [
          {
            "severity": "high" | "medium" | "low",
            "message": string,        // 問題の説明
            "nodeId": string,         // 該当ノードのID（例: "1809:1837"）
            "nodeHierarchy": string,  // 階層パス（例: "Login Screen > Email Input"）
            "autoFixable": boolean,   // 自動修正可能か
            "suggestion": string      // 改善提案
          }
        ],
        "positives": string[]         // ポジティブ項目（良い点）
      },
      // ... 他のカテゴリ
    },
    "suggestions": [
      {
        "category": string,           // カテゴリ名
        "priority": "high" | "medium" | "low",
        "title": string,              // 提案タイトル
        "description": string,        // 提案詳細
        "impact": string              // 改善による影響
      }
    ],
    "metadata": {
      "evaluatedAt": string,          // 評価日時（ISO 8601形式）
      "duration": number,             // 評価にかかった時間（ミリ秒）
      "tokenUsage": {
        "inputTokens": number,
        "outputTokens": number,
        "cachedTokens": number,
        "estimatedCost": number       // 推定コスト（USD）
      }
    }
  }
}
```

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "overallScore": 72,
    "categories": {
      "accessibility": {
        "score": 65,
        "issues": [
          {
            "severity": "high",
            "message": "テキストとバックグラウンドのコントラスト比が不足しています（2.8:1）。WCAG AA基準の4.5:1を満たしていません。",
            "nodeId": "1809:1840",
            "nodeHierarchy": "Login Screen > Email Label",
            "autoFixable": false,
            "suggestion": "テキストカラーを#333333に変更するか、バックグラウンドを明るくしてください。"
          },
          {
            "severity": "medium",
            "message": "タッチターゲットのサイズが小さすぎます（32x32px）。推奨最小サイズは44x44pxです。",
            "nodeId": "1809:1845",
            "nodeHierarchy": "Login Screen > Submit Button",
            "autoFixable": true,
            "suggestion": "ボタンのpaddingを増やして最低44x44pxを確保してください。"
          }
        ],
        "positives": [
          "適切なフォントサイズ（16px）が使用されています",
          "テキストフィールドにplaceholderが設定されています"
        ]
      }
    },
    "suggestions": [
      {
        "category": "accessibility",
        "priority": "high",
        "title": "カラーコントラストの改善",
        "description": "複数の要素でWCAG AA基準を満たしていないカラーコントラストが検出されました。",
        "impact": "視覚障害のあるユーザーや低照度環境でのユーザビリティが大幅に向上します。"
      }
    ],
    "metadata": {
      "evaluatedAt": "2025-01-15T10:30:45.123Z",
      "duration": 28450,
      "tokenUsage": {
        "inputTokens": 5200,
        "outputTokens": 1850,
        "cachedTokens": 0,
        "estimatedCost": 0.043
      }
    }
  }
}
```

#### エラー時（4xx, 5xx）

```typescript
{
  "success": false,
  "error": string,          // エラーメッセージ
  "details"?: unknown       // 追加のエラー詳細（開発環境のみ）
}
```

#### エラーレスポンス例

**400 Bad Request** - バリデーションエラー

```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "path": ["nodeData", "id"],
      "message": "Required"
    }
  ]
}
```

**500 Internal Server Error** - サーバーエラー

```json
{
  "success": false,
  "error": "Evaluation failed",
  "details": "Claude API request timeout"
}
```

### 実行時間

| 実行モード                          | 推定時間 | 説明                                       |
| ----------------------------------- | -------- | ------------------------------------------ |
| 単一エージェント                    | 15-20秒  | 1つのエージェントのみ実行                  |
| 全エージェント（4つ）               | 20-30秒  | 並列実行のため、最も遅いエージェントに依存 |
| 全エージェント（5つ、platform含む） | 30-40秒  | platformComplianceを含む場合               |

**注**: 実行時間はノードの複雑さ、Claude APIのレスポンス時間に依存します。

### バリデーション

リクエストボディは以下のルールで検証されます：

<!-- CODE_REF: backend/src/routes/evaluation.ts:74-111 -->

```typescript
// Zodスキーマによる厳格なバリデーション
const evaluationRequestSchema = z.object({
  fileKey: z.string(),
  nodeId: z.string(),
  nodeData: z
    .object({
      id: z.string(),
      name: z.string(),
      type: figmaNodeTypeSchema, // 厳密な型チェック（40種類のFigmaノードタイプ）
    })
    .passthrough(), // 追加のプロパティを許可
  stylesData: z
    .object({
      // ... スタイルデータのスキーマ
    })
    .optional(),
  evaluationTypes: z.array(z.string()).optional(),
  platformType: z.enum(['ios', 'android']).optional(),
  userId: z.string().optional(),
  userContext: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length <= USER_CONTEXT_MAX_LENGTH,
      `想定ユーザーと利用文脈は${USER_CONTEXT_MAX_LENGTH}文字以内で入力してください`
    ), // ユーザーコンテキスト（オプション、trim後100文字以内）
  screenshot: screenshotDataSchema.optional(), // スクリーンショットデータ（オプション）
});
```

**型安全性の向上:**

バックエンドでは`FigmaNodeType`に対応する`figmaNodeTypeSchema`を使用し、リクエスト時に無効なノードタイプを検出します。これにより、実行時エラーを防ぎ、より堅牢なAPIを実現しています。

<!-- CODE_REF: backend/src/routes/evaluation.ts:24-92 -->

---

## GET /api/health

APIサーバーのヘルスチェックエンドポイント。サーバーが正常に起動しているかを確認します。

### リクエスト

```
GET /api/health
```

### レスポンス

#### 成功時（200 OK）

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "version": "1.0.0"
}
```

---

## レート制限

現在、レート制限は実装されていません。本番環境では、以下の制限を検討してください：

- **リクエスト数**: 1ユーザーあたり10リクエスト/分
- **同時接続数**: 最大50接続
- **タイムアウト**: 60秒

## CORS設定

<!-- CODE_REF: backend/src/index.ts:20-30 -->

```typescript
// 開発環境: 全てのオリジンを許可
// 本番環境: 環境変数CORS_ORIGINで指定されたオリジンのみ許可
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);
```

## 次のステップ

- [バックエンド実装](./services.md)
