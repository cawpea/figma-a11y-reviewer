import type { EvaluationResult } from '@shared/types';

/**
 * モックAPI用の評価結果データ
 *
 * 全ての評価タイプ（accessibility, writing）に対応したモックデータ。
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
      category: 'accessibility',
      message:
        'アクセシビリティテストツール（例: Axe、Lighthouse）を使用して、自動チェックを実施することをお勧めします。',
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
