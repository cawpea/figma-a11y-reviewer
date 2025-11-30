# システムアーキテクチャ概要

このドキュメントでは、Figma UI
Reviewerのシステム全体のアーキテクチャを説明します。

## システム構成

Figma UI
Reviewerは、**Figmaプラグイン**（フロントエンド）と**Express.jsバックエンドAPI**の2つの主要コンポーネントで構成されています。

```
┌─────────────────────────────────────────────────────────────┐
│                        Figma Desktop                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Figma UI Reviewer Plugin                 │  │
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
                            │ (FigmaNodeData, FigmaStylesData)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
│                   (Express.js + TypeScript)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  EvaluationService                                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  並列実行 (Promise.all)                         │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐             │  │  │
│  │  │  │ Accessibility│  │StyleConsist. │  ...        │  │  │
│  │  │  │    Agent     │  │    Agent     │             │  │  │
│  │  │  └──────────────┘  └──────────────┘             │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ Anthropic SDK
                            │ (System Prompt + User Prompt)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Claude API (Anthropic)                     │
│                  Model: claude-sonnet-4                     │
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

<!-- CODE_REF: figma-plugin/src/utils/figma.utils.ts:12-45 -->

```typescript
/**
 * Figmaノードからデータを再帰的に抽出
 * 最大深度: 10階層
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

  // 基本情報の抽出
  const data: FigmaNodeData = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // スタイル、レイアウト、テキスト情報の抽出...
  // 子要素の再帰的抽出...

  return data;
}
```

### 2. バックエンドでの評価処理

<!-- CODE_REF: backend/src/services/evaluation.service.ts:38-80 -->

```typescript
/**
 * デザインを評価（並列実行）
 */
async evaluateDesign(
  data: FigmaNodeData,
  stylesData?: FigmaStylesData,
  evaluationTypes?: string[],
  rootNodeId?: string,
  platformType?: 'ios' | 'android'
): Promise<EvaluationResult> {
  const startTime = Date.now();

  // 評価タイプが指定されていない場合は全て実行
  const typesToRun = evaluationTypes
    ? evaluationTypes.filter((type) => type in this.agents || type === 'platformCompliance')
    : Object.keys(this.agents);

  console.log(`Starting evaluation for types: ${typesToRun.join(', ')}`);

  // 並列実行（Promise.all）
  const evaluationPromises = typesToRun.map(async (type) => {
    let agent: BaseEvaluationAgent | undefined;

    // platformComplianceの場合、platformTypeに応じて動的にエージェントを選択
    if (type === 'platformCompliance') {
      const selectedPlatform = platformType || 'ios';
      agent = selectedPlatform === 'ios' ? new PlatformIosAgent() : new PlatformAndroidAgent();
    } else {
      agent = this.agents[type as keyof typeof this.agents];
    }

    if (!agent) {
      console.warn(`Unknown evaluation type: ${type}`);
      return null;
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

<!-- CODE_REF: backend/src/services/agents/base.agent.ts:14-50 -->

```typescript
export abstract class BaseEvaluationAgent {
  protected abstract systemPrompt: string;
  protected abstract category: string;

  /**
   * Claude APIを呼び出す
   */
  protected async callClaude(prompt: string): Promise<Anthropic.Message> {
    try {
      const response = await anthropic.messages.create({
        model: MODEL_CONFIG.default,
        max_tokens: MODEL_CONFIG.maxTokens,
        temperature: MODEL_CONFIG.temperature, // 0: 一貫性を保証
        system: this.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
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

<!-- CODE_REF: backend/src/routes/evaluation.ts:24-51 -->

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
3. **トークン最適化**: Claude APIの`max_tokens: 4000`設定
4. **キャッシング**: （将来実装予定）Prompt Caching for Claude

## エラーハンドリング戦略

> **詳細**: [../api/error-handling.md](../api/)

1. **バリデーションエラー**: 400 Bad Request（Zodエラーメッセージ）
2. **評価エラー**: 個別エージェントでエラーが発生してもスコア0で結果を返す
3. **Claude APIエラー**: リトライロジック（未実装）、エラーログ
4. **共通エラーハンドラー**: `middleware/error-handler.ts`で一元管理

## 次のステップ

- [評価エージェントシステムの詳細](./agent-system.md)
- [データフローの詳細](./data-flow.md)
- [型システムの設計](./type-system.md)
- [API仕様](../api/endpoints.md)
