# システムアーキテクチャ概要

このドキュメントでは、Figma A11y
Reviewerのシステム全体のアーキテクチャを説明します。

## システム構成

Figma A11y
Reviewerは、**Figmaプラグイン**（フロントエンド）と**Express.jsバックエンドAPI**の2つの主要コンポーネントで構成されています。

**評価対象**: アクセシビリティ（WCAG 2.2 Level A/AA/AAA準拠）

- Level
  A: 色の使用、情報構造、ラベル、リンクの目的など（コントラスト比は含まない）
- Level AA: Level A + 色のコントラスト（4.5:1 /
  3:1）、タッチターゲットサイズなど
- Level AAA: Level AA + 強化コントラスト（7:1 /
  4.5:1）、視覚的プレゼンテーション（行間・テキスト幅）、テキスト画像の完全除外、強化ターゲットサイズ（44x44px）、リンク目的の厳格化、ナビゲーション構造、フォーカス可視性強化など

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

| 技術                      | 用途              | 選定理由                                  |
| ------------------------- | ----------------- | ----------------------------------------- |
| **Express.js**            | Webフレームワーク | シンプル、Node.jsのデファクトスタンダード |
| **TypeScript**            | 型安全性          | フロントエンドと共通の型定義を共有        |
| **Anthropic SDK**         | Claude API連携    | 公式SDK、型サポート                       |
| **Zod**                   | バリデーション    | 型安全なスキーマバリデーション            |
| **dotenv**                | 環境変数管理      | APIキーなどの秘密情報管理                 |
| **Firebase Functions v2** | デプロイ基盤      | サーバーレス、スケーラブル                |

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
  apiKey: z.string().min(1, 'API Key is required'), // ユーザー提供のClaude API Key（必須）
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

## デプロイメント構成

### 開発環境とデプロイ環境

Figma A11y Reviewerのバックエンドは、開発環境とデプロイ環境で異なる実行方式を採用しています。

#### 開発環境（ローカル）

<!-- CODE_REF: backend/src/index.ts:62-71 -->

開発環境では、Expressアプリを直接起動します：

```typescript
if (process.env.NODE_ENV === 'development') {
  // サーバー起動
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/evaluate`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  });

  cleanupOldDebugFiles();
}
```

**起動コマンド**: `npm run dev` → `NODE_ENV=development tsx --env-file=.env src/index.ts`

#### 本番環境（Firebase Cloud Functions v2）

<!-- CODE_REF: backend/src/index.ts:73-82 -->

本番環境では、Firebase Functions v2の`onRequest`でラップしてデプロイします：

```typescript
// Cloud Functions用エクスポート
export const api = onRequest(
  {
    region: 'asia-northeast1', // 東京リージョン
    timeoutSeconds: 300,
    memory: '1GiB',
    invoker: 'public', // 未認証アクセスを許可（Figmaプラグインからのアクセスに必要）
  },
  app
);
```

**デプロイコマンド**: `npm run deploy` → `NODE_ENV=production npm run build && firebase deploy --only functions`

### ビルド成果物の管理

**重要**: Firebase Functionsのデプロイには、コンパイル済みのJavaScriptファイル（`dist/`）が必要です。

<!-- CODE_REF: .gitignore:1-4 -->

通常、`dist/`ディレクトリはビルド成果物としてGitに含めませんが、Firebase Functionsデプロイのため`backend/dist/`のみ例外的にGitに含めます：

```gitignore
node_modules/
# Exclude dist/ globally, but allow backend/dist/ for Firebase Functions deployment
figma-plugin/dist/
shared/dist/
```

**理由**:
- Firebase Functionsはデプロイ時に`source`ディレクトリ（ここでは`backend/`）をそのままアップロードします
- ビルドステップを事前に実行し、コンパイル済みファイルをリポジトリに含める必要があります
- CI/CDでビルドする方法もありますが、現在はシンプルにGit管理しています

### デプロイ設定ファイル

#### `.firebaserc`

<!-- CODE_REF: .firebaserc:1-5 -->

Firebaseプロジェクトを指定：

```json
{
  "projects": {
    "default": "figma-accessibility-reviewer"
  }
}
```

#### `firebase.json`

<!-- CODE_REF: firebase.json:1-11 -->

Firebase Functionsの設定：

```json
{
  "functions": [
    {
      "source": "backend",
      "codebase": "default",
      "disallowLegacyRuntimeConfig": true,
      "ignore": ["node_modules", ".git", "*.local"],
      "predeploy": []
    }
  ]
}
```

#### `backend/.gcloudignore`

<!-- CODE_REF: backend/.gcloudignore:16-40 -->

デプロイ時に除外するファイルを指定：

```gitignore
# Node.js dependencies:
node_modules/

# TypeScript source files (we only need the compiled dist/)
src/
*.ts
tsconfig.json
tsconfig.test.json

# Test files
*.test.js
jest.config.js
coverage/

# Environment files
.env
.env.local
.env.example

# Logs
logs/
*.log
debug-*.json

# Development files
.DS_Store
```

**重要**: TypeScriptソースファイル（`src/`）はデプロイから除外され、コンパイル済みの`dist/`のみがアップロードされます。

### 環境変数の管理

#### 開発環境

`backend/.env`ファイルで管理（Gitには含めない）：

```bash
# オプション: ローカル開発時のポート設定
PORT=3000

# オプション: デバッグログを明示的に有効化
DEBUG=true
```

**注意**: `NODE_ENV`は`.env`ファイルで設定する必要はありません。npm scriptsで自動的に設定されます（`dev`コマンドは`development`、`deploy`コマンドは`production`）。

#### 本番環境（Cloud Functions）

Cloud Functionsでは、環境変数は以下の方法で設定します：

1. **Firebase Consoleから設定**（推奨）:
   - Firebase Console > Functions > 設定 > 環境変数
   - 秘密情報（API Keyなど）は表示されません

2. **Firebase CLIで設定**:
   ```bash
   firebase functions:config:set someservice.key="THE API KEY"
   ```

**注意**: Figma A11y Reviewerでは、Claude API KeyをユーザーがFigmaプラグインで設定するため、バックエンドの環境変数としてAPI Keyを保存する必要はありません。

### デプロイフロー

```bash
# 1. ローカルでビルド
cd backend
npm run build

# 2. Firebaseにログイン（初回のみ）
firebase login

# 3. デプロイ
npm run deploy
```

**デプロイされるURL**: `https://asia-northeast1-figma-accessibility-reviewer.cloudfunctions.net/api`

このURLが`figma-plugin/.env.production`の`API_BASE_URL`に設定されます。

### スケーリングと制限

Firebase Functions v2の設定：

- **リージョン**: `asia-northeast1`（東京）
- **タイムアウト**: 300秒（5分）
- **メモリ**: 1GiB
- **同時実行数**: デフォルト（1000）
- **アクセス制御**: `public`（未認証アクセス許可）

**注意**: Claude APIの応答時間は通常20-40秒ですが、複数エージェントを並列実行するため、十分なタイムアウトを設定しています。

## セキュリティとパフォーマンス

### セキュリティ対策

1. **APIキー管理**:
   - **ユーザー提供のAPI Key**: ユーザーが各自のClaude API Keyを設定
   - **ローカル保存**: API
     Keyは`figma.clientStorage`にローカル保存され、サーバー側では保存されません
   - **リクエスト時に送信**: 各評価リクエストでAPI
     Keyが送信され、バックエンドはそのKeyでClaude APIを呼び出します
   - **バリデーション**: `sk-ant-`形式のチェックを実装
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
