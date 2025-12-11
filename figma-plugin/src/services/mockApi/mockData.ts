import type { EvaluationResult } from '@shared/types';

/**
 * モックAPI用の評価結果データ
 *
 * 全ての評価タイプ（accessibility, styleConsistency, platformCompliance, writing）に対応したモックデータ。
 * 開発環境でバックエンドAPIなしにUI開発・テストを行うために使用します。
 */
export const MOCK_EVALUATION_RESULT: EvaluationResult = {
  categories: {
    accessibility: {
      issues: [
        {
          severity: 'high',
          message: 'ボタンのテキストが小さすぎます。最小でも16pxが推奨されます。',
          nodeId: '123:456',
          nodeHierarchy: ['mock-root-node', 'header-frame', 'button-primary'],
          autoFixable: false,
          suggestion: 'フォントサイズを16px以上に変更してください',
        },
        {
          severity: 'medium',
          message:
            'テキストとボタン背景のコントラスト比が不十分です（現在: 3.2:1、推奨: 4.5:1以上）。',
          nodeId: '123:457',
          nodeHierarchy: ['mock-root-node', 'content-frame', 'secondary-button'],
          autoFixable: false,
          suggestion: 'より濃い色を使用するか、テキストの色を変更してください',
        },
        {
          severity: 'low',
          message: 'アイコンのみのボタンにはアクセシビリティラベルが必要です。',
          nodeId: '123:458',
          autoFixable: false,
          suggestion: 'aria-labelまたはalt属性を追加してください',
        },
      ],
      positives: [
        '適切なフォーカスインジケーターが設定されています',
        'セマンティックな見出し階層が使用されています',
      ],
    },
    styleConsistency: {
      issues: [
        {
          severity: 'medium',
          message: '複数の異なる青色が使用されています（#1E90FF、#4169E1、#0066CC）。',
          nodeId: '123:465',
          autoFixable: false,
          suggestion: 'カラーパレットを統一し、定義済みのカラースタイルを使用してください',
        },
        {
          severity: 'medium',
          message: 'フォントサイズが統一されていません（14px、15px、16pxが混在）。',
          nodeId: '123:466',
          autoFixable: false,
          suggestion: 'タイポグラフィスケールを定義し、テキストスタイルを使用してください',
        },
        {
          severity: 'low',
          message: 'スペーシング（マージン/パディング）が一貫していません。',
          nodeId: '123:467',
          autoFixable: false,
          suggestion: '8pxグリッドシステムなど、一貫したスペーシングルールを適用してください',
        },
      ],
      positives: ['ボーダー半径が統一されています', 'シャドウスタイルが一貫して使用されています'],
    },
    platformCompliance: {
      issues: [
        {
          severity: 'high',
          message:
            'iOSのSafe Areaを考慮していません。ノッチやホームインジケーターでコンテンツが隠れる可能性があります。',
          nodeId: '123:470',
          autoFixable: false,
          suggestion: '画面上下に適切なパディング（Safe Area Insets）を追加してください',
        },
        {
          severity: 'medium',
          message: 'ナビゲーションバーの高さがiOSガイドライン（44pt）に準拠していません。',
          nodeId: '123:471',
          autoFixable: false,
          suggestion: 'ナビゲーションバーの高さを44ptに変更してください',
        },
      ],
      positives: [
        'iOSのシステムフォント（SF Pro）が使用されています',
        'タブバーのアイコンサイズが適切です',
      ],
    },
    writing: {
      issues: [
        {
          severity: 'medium',
          message: 'エラーメッセージが技術的すぎます：「Error 400: Bad Request」',
          nodeId: '123:475',
          autoFixable: false,
          suggestion:
            'ユーザーフレンドリーな表現に変更してください。例：「入力内容を確認してください」',
        },
        {
          severity: 'low',
          message: 'ボタンのラベルが曖昧です：「次へ」より具体的な表現が望ましいです。',
          nodeId: '123:476',
          autoFixable: false,
          suggestion: '「設定を保存」など、何が起こるかを明確にしてください',
        },
      ],
      positives: ['見出しが簡潔で理解しやすいです', 'トーンとボイスが一貫しています'],
    },
  },
  suggestions: [
    {
      severity: 'low',
      category: 'styleConsistency',
      message:
        'デザインシステムの導入を検討してください。カラーパレット、タイポグラフィスケール、スペーシングルールを標準化することで、一貫性を向上できます。',
      autoFixable: false,
    },
    {
      severity: 'low',
      category: 'accessibility',
      message:
        'アクセシビリティテストツール（例: Axe、Lighthouse）を使用して、自動チェックを実施することをお勧めします。',
      autoFixable: false,
    },
    {
      severity: 'low',
      category: 'platformCompliance',
      message:
        'プラットフォーム固有のガイドライン（iOS Human Interface Guidelines、Material Design）を参照し、ベストプラクティスに従ってください。',
      autoFixable: false,
    },
  ],
  metadata: {
    evaluatedAt: new Date(),
    duration: 2500,
    rootNodeId: 'mock-root-node',
    usage: {
      totalInputTokens: 1200,
      totalOutputTokens: 800,
      totalCachedTokens: 0,
      estimatedCost: 0.015,
    },
  },
};
