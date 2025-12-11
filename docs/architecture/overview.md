# システムアーキテクチャ概要

このドキュメントでは、Figma A11y
Reviewerのシステム全体のアーキテクチャを説明します。

## システム構成

Figma A11y
Reviewerは、**Figmaプラグイン**（フロントエンド）と**Express.jsバックエンドAPI**の2つの主要コンポーネントで構成されています。

**評価対象**: アクセシビリティ（WCAG 2.2
AA準拠、色のコントラスト、タッチターゲットサイズ）

```
┌─────────────────────────────────────────────────────────────┐
│                        Figma Desktop                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Figma A11y Reviewer Plugin               │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  UI (Preact + TailwindCSS)                      │  │  │
│  │  │  - Plugin (初期ページ、エージェント選択)       │  │  │
│  │  │  - ReviewResultView (レビュー結果ページ)       │  │  │
│  │  │  - ResultView (評価結果表示)                    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Main Thread (main.ts)                          │  │  │
│  │  │  - Figma API連携                                │  │  │
│  │  │  - ノードデータ抽出 (figma.utils.ts)           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP POST /api/evaluate
                            │ (FigmaNodeData, FigmaStylesData, ScreenshotData)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
│                   (Express.js + TypeScript)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  EvaluationService                                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  並列実行 (Promise.all)                         │  │  │
│  │  │  ┌──────────────┐                                │  │  │
│  │  │  │ Accessibility│                                │  │  │
│  │  │  │    Agent     │                                │  │  │
│  │  │  └──────────────┘                                │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ Anthropic SDK
                            │ (System Prompt + User Prompt)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Claude API (Anthropic)                     │
│                  Model: claude-sonnet-4                     │
│           Vision API (スクリーンショット分析対応)           │
└─────────────────────────────────────────────────────────────┘
                            ↓ JSON Response
                            │ (Issues, Positives, Score)
                            ↓
                     結果の集約とレスポンス
                            ↓
                    Figmaプラグインに表示
```

## 技術スタック

### フロントエンド（Figmaプラグイン）

| 技術                    | 用途             | 選定理由                                 |
| ----------------------- | ---------------- | ---------------------------------------- |
| **Preact**              | UIフレームワーク | 軽量（3KB）、React互換、プラグインに最適 |
| **TailwindCSS**         | スタイリング     | ユーティリティファースト、迅速な開発     |
| **TypeScript**          | 型安全性         | バグ防止、開発者体験の向上               |
| **Create Figma Plugin** | ビルドツール     | Figmaプラグイン開発の標準ツール          |
| **Figma Plugin API**    | Figma連携        | ノードデータの抽出、スタイル情報取得     |

### バックエンド（API）

| 技術              | 用途              | 選定理由                                  |
| ----------------- | ----------------- | ----------------------------------------- |
| **Express.js**    | Webフレームワーク | シンプル、Node.jsのデファクトスタンダード |
| **TypeScript**    | 型安全性          | フロントエンドと共通の型定義を共有        |
| **Anthropic SDK** | Claude API連携    | 公式SDK、型サポート                       |
| **Zod**           | バリデーション    | 型安全なスキーマバリデーション            |
| **dotenv**        | 環境変数管理      | APIキーなどの秘密情報管理                 |

### 共通

| 技術                     | 用途                                |
| ------------------------ | ----------------------------------- |
| **TypeScript Workspace** | モノレポ管理（`shared/`パッケージ） |
| **Jest**                 | テストフレームワーク                |
| **ESLint + Prettier**    | コード品質とフォーマット            |

## データフロー詳細

### 1. ユーザーアクション → データ抽出

<!-- CODE_REF: figma-plugin/src/utils/figma.utils.ts:93-160 -->

```typescript
/**
 * Figmaノードからデータを再帰的に抽出
 * 最大深度: 10階層
 *
 * 【非表示ノードの処理】
 * - ルートノード(depth === 0)が非表示の場合はエラーをスロー
 * - 非ルートの非表示ノードは評価対象から除外（子要素もスキップ）
 */
export async function extractNodeData(
  node: SceneNode,
  depth: number = 0
): Promise<FigmaNodeData> {
  const MAX_DEPTH = 10;

  if (depth > MAX_DEPTH) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      note: 'Max depth reached',
    };
  }

  // 非表示ノードの処理
  if ('visible' in node && node.visible === false) {
    // ルートノードの場合はエラー
    if (depth === 0) {
      throw new Error(
        '選択したフレームが非表示です。評価する前に表示してください'
      );
    }
    // 非ルートの非表示ノードは最小限の情報のみ返す
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      note: 'Hidden layer (excluded from evaluation)',
    };
  }

  // 基本情報の抽出
  const data: FigmaNodeData = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // スタイル、レイアウト、テキスト情報の抽出...
  // 子要素の再帰的抽出（非表示の子要素はスキップ）...

  return data;
}
```

### 2. バックエンドでの評価処理

<!-- CODE_REF: backend/src/services/evaluation.service.ts:36-100 -->

```typescript
/**
 * デザインを評価（並列実行）
 * 現在はAccessibilityAgentのみ利用可能
 */
async evaluateDesign(
  data: FigmaNodeData,
  stylesData?: FigmaStylesData,
  evaluationTypes?: string[],
  rootNodeId?: string,
  screenshot?: ScreenshotData // スクリーンショットデータ（オプション）
): Promise<EvaluationResult> {
  const startTime = Date.now();

  // 評価タイプが指定されていない場合は全て実行
  const typesToRun = evaluationTypes
    ? evaluationTypes.filter((type) => type in this.agents)
    : Object.keys(this.agents);

  console.log(`Starting evaluation for types: ${typesToRun.join(', ')}`);
  if (screenshot) {
    console.log(`📷 Screenshot provided: ${(screenshot.byteSize / 1024).toFixed(2)} KB`);
  }

  // 並列実行（Promise.all）
  const evaluationPromises = typesToRun.map(async (type) => {
    const agent = this.agents[type as keyof typeof this.agents];

    if (!agent) {
      console.warn(`Unknown evaluation type: ${type}`);
      return null;
    }

    // スタイルデータをエージェントに注入
    if (stylesData) {
      agent.setStylesData(stylesData);
    }

    // スクリーンショットをエージェントに注入
    if (screenshot) {
      agent.setScreenshot(screenshot);
    }

    // 評価実行
    return await agent.evaluate(data, rootNodeId);
  });

  // 全エージェントの結果を待機
  const results = await Promise.all(evaluationPromises);

  // ... 結果の集約、スコア計算、提案のソート
}
```

### 3. 各エージェントによる評価

<!-- CODE_REF: backend/src/services/agents/base.agent.ts:9-85 -->

```typescript
export abstract class BaseEvaluationAgent {
  protected abstract systemPrompt: string;
  protected abstract category: string;

  // スクリーンショットを保持（サブクラスで設定可能）
  protected screenshot: ScreenshotData | null = null;

  /**
   * スクリーンショットを設定
   * EvaluationServiceから呼び出される
   */
  setScreenshot(screenshot: ScreenshotData | null): void {
    this.screenshot = screenshot;
  }

  /**
   * Claude APIを呼び出す（Vision API対応）
   */
  protected async callClaude(prompt: string): Promise<Anthropic.Message> {
    try {
      // ContentBlock配列を構築
      const contentBlocks: Anthropic.MessageParam['content'] = [];

      // スクリーンショットがある場合は先頭に追加
      if (this.screenshot) {
        const base64Data = this.screenshot.imageData.replace(
          /^data:image\/png;base64,/,
          ''
        );

        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: base64Data,
          },
        });

        console.log(`📷 Screenshot included for ${this.category} evaluation`);
        console.log(
          `   Size: ${(this.screenshot.byteSize / 1024).toFixed(2)} KB`
        );
      }

      // テキストプロンプトを追加
      contentBlocks.push({
        type: 'text',
        text: prompt,
      });

      const response = await anthropic.messages.create({
        model: MODEL_CONFIG.default,
        max_tokens: MODEL_CONFIG.maxTokens,
        temperature: MODEL_CONFIG.temperature, // 0: 一貫性を保証
        system: this.systemPrompt,
        messages: [
          {
            role: 'user',
            content: contentBlocks, // 画像 + テキストのコンテンツブロック
          },
        ],
      });

      // デバッグ用にプロンプトとレスポンスを保存
      savePromptAndResponse(this.systemPrompt, prompt, this.category, response);

      return response;
    } catch (error) {
      console.error(`Error calling Claude API for ${this.category}:`, error);
      throw error;
    }
  }

  /**
   * レスポンスをパースして構造化
   */
  protected parseResponse(
    response: Anthropic.Message,
    rootNodeData: FigmaNodeData
  ): CategoryResult {
    // JSON抽出、nodeId検証、階層パスの追加
    // ...
  }
}
```

### 4. 類似Issue集約機能

<!-- CODE_REF: backend/src/utils/prompt.utils.ts:1116-1133 -->

同じ色の組み合わせが複数のテキストノードに適用されている場合、個別のIssueではなく1つのグループ化されたIssueとして返します。

#### グループ化の流れ

**ステップ1: バックエンドでのグループ化**

`buildColorContrastMap()`関数が同じ色の組み合わせ（`textColor|backgroundColor`）でノードをグループ化します。

```typescript
// グループ化前（個別）
[
  {
    textColor: '#999999',
    backgroundColor: '#F5F5F5',
    nodeId: '1809:1836',
    nodeName: 'Button',
  },
  {
    textColor: '#999999',
    backgroundColor: '#F5F5F5',
    nodeId: '1809:1850',
    nodeName: 'Title',
  },
  {
    textColor: '#999999',
    backgroundColor: '#F5F5F5',
    nodeId: '1809:1870',
    nodeName: 'Label',
  },
][
  // グループ化後
  {
    textColor: '#999999',
    backgroundColor: '#F5F5F5',
    contrastRatio: 2.8,
    nodes: [
      { nodeId: '1809:1836', nodeName: 'Button' },
      { nodeId: '1809:1850', nodeName: 'Title' },
      { nodeId: '1809:1870', nodeName: 'Label' },
    ],
  }
];
```

**ステップ2: LLMへの指示**

JSON
schemaで「同じ色の組み合わせが複数ノードにある場合は`nodeIds`配列を使用」と指示します。

```typescript
{
  "nodeIds": ["1809:1836", "1809:1850", "1809:1870"]  // 配列として返す
}
```

**ステップ3: フロントエンドでの表示**

<!-- CODE_REF: figma-plugin/src/components/IssueItem/index.tsx:33-36 -->

複数ノードの場合、「○個の要素」バッジを表示し、「選択」ボタンで全ノードを一括選択します。

```typescript
{nodeCount > 1 && (
  <Badge severity="neutral" label={`${nodeCount}個の要素`} />
)}
```

#### 利点

- **UIがすっきり**: 重複Issueが減り、レビュー結果が見やすい
- **効率的な修正**: 複数ノードを一括選択できる
- **トークン削減**: グループ化によりLLMコンテキストサイズが削減

#### 後方互換性

`Issue`型は`nodeId`（単一）と`nodeIds`（複数）の両方をサポートし、`nodeIds`が優先されます。

**詳細**:
[共通型定義](../shared/types.md#issue型---評価問題の型定義)を参照してください。

---

## 評価エージェントシステム

> **詳細**: [agent-system.md](./agent-system.md)

各評価エージェントは`BaseEvaluationAgent`を継承し、以下の責務を持ちます：

| 責務              | 説明                                              |
| ----------------- | ------------------------------------------------- |
| `systemPrompt`    | 評価基準とJSON出力フォーマットを定義              |
| `buildPrompt()`   | FigmaノードデータからClaude用プロンプトを生成     |
| `callClaude()`    | Claude APIを呼び出し（temperature=0で一貫性保証） |
| `parseResponse()` | レスポンスをパースし、nodeId検証・階層パス追加    |
| `evaluate()`      | 上記を統合した評価実行メソッド                    |

### 現在実装されているエージェント

1. **AccessibilityAgent** - WCAG 2.2 AA準拠の評価
2. **StyleConsistencyAgent** - スタイルシステムの一貫性評価
3. **UsabilityAgent** - Nielsen's 10 Heuristics評価
4. **WritingAgent** - ライティング・コピー品質評価
5. **PlatformIosAgent** - iOS Human Interface Guidelines準拠評価
6. **PlatformAndroidAgent** - Material Design準拠評価

## リクエスト/レスポンス形式

### リクエスト（POST /api/evaluate）

<!-- CODE_REF: backend/src/routes/evaluation.ts:24-92 -->

```typescript
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
      variables: z.array(variableInfoSchema),
      textStyles: z.array(styleInfoSchema),
      colorStyles: z.array(styleInfoSchema),
      effectStyles: z.array(styleInfoSchema),
      meta: z.object({
        variablesCount: z.number(),
        textStylesCount: z.number(),
        colorStylesCount: z.number(),
        effectStylesCount: z.number(),
        truncated: z.boolean(),
      }),
    })
    .optional(),
  evaluationTypes: z.array(z.string()).optional(),
  platformType: z.enum(['ios', 'android']).optional(),
  userId: z.string().optional(),
  screenshot: screenshotDataSchema.optional(), // スクリーンショットデータ（Vision API用）
});
```

### レスポンス（EvaluationResult）

```typescript
{
  overallScore: number,           // 総合スコア（0-100）
  categories: {
    [category: string]: {
      score: number,              // カテゴリスコア（0-100）
      issues: Issue[],            // 問題項目リスト
      positives?: string[]        // ポジティブ項目（良い点）
    }
  },
  suggestions: Suggestion[],      // 改善提案（重要度順ソート済み）
  metadata: {
    evaluatedAt: string,          // 評価日時（ISO 8601）
    duration: number,             // 評価にかかった時間（ms）
    tokenUsage?: {
      inputTokens: number,
      outputTokens: number,
      estimatedCost: number       // USD
    }
  }
}
```

## セキュリティとパフォーマンス

### セキュリティ対策

1. **APIキー管理**: 環境変数（`.env`）で管理、GitIgnore設定
2. **入力バリデーション**: Zodスキーマで厳格な検証
3. **nodeId形式検証**: ReDoS攻撃対策を含む正規表現検証
4. **CORS設定**: 本番環境では適切なオリジン制限

### パフォーマンス最適化

1. **並列実行**: Promise.allで全エージェントを同時実行
2. **データ制限**:
   - Figmaノード抽出の最大深度: 10階層
   - スタイル情報: 各カテゴリ最大100個
3. **トークン最適化**: Claude APIの`max_tokens: 8000`設定（Claude Sonnet
   4.5の最大出力トークン数は8192）
4. **キャッシング**: （将来実装予定）Prompt Caching for Claude

## エラーハンドリング戦略

1. **バリデーションエラー**: 400 Bad Request（Zodエラーメッセージ）
2. **評価エラー**: 個別エージェントでエラーが発生してもスコア0で結果を返す
3. **Claude APIエラー**: リトライロジック（未実装）、エラーログ
4. **共通エラーハンドラー**: `middleware/error-handler.ts`で一元管理

## 次のステップ

- [評価エージェントシステムの詳細](./agent-system.md)
- [データフローの詳細](./data-flow.md)
- [型システムの設計](./type-system.md)
- [API仕様](../backend/api.md)
