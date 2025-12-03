import type { EvaluationResult } from '@shared/types';

import { MOCK_EVALUATION_RESULT } from './mockData';

export interface MockApiOptions {
  evaluationTypes?: string[];
  platformType?: 'ios' | 'android';
  delay?: number; // ネットワーク遅延のシミュレーション（ミリ秒）
}

/**
 * モックAPI評価サービス
 *
 * バックエンドAPIを呼び出さずにモックデータを返します。
 * ネットワーク遅延をシミュレートし、リアルな動作確認が可能です。
 *
 * @param options - モックAPIのオプション
 * @param options.evaluationTypes - 評価タイプのフィルタ（例: ['accessibility', 'usability']）
 * @param options.platformType - プラットフォームタイプ（'ios' | 'android'）
 * @param options.delay - シミュレートする遅延時間（デフォルト: 1500ms）
 * @returns 評価結果（EvaluationResult）
 */
export async function callMockEvaluationAPI(
  options: MockApiOptions = {}
): Promise<EvaluationResult> {
  const { evaluationTypes, platformType, delay = 1500 } = options;

  // ネットワーク遅延をシミュレート
  await new Promise((resolve) => setTimeout(resolve, delay));

  // カテゴリのディープコピーを作成
  const filteredCategories = { ...MOCK_EVALUATION_RESULT.categories };

  // evaluationTypesが指定されている場合、選択されたカテゴリのみ返す
  if (evaluationTypes && evaluationTypes.length > 0) {
    Object.keys(filteredCategories).forEach((key) => {
      if (!evaluationTypes.includes(key)) {
        delete filteredCategories[key];
      }
    });
  }

  // プラットフォームタイプが指定されている場合のログ出力（将来的な拡張用）
  if (platformType) {
    console.log(`[Mock API] Platform type: ${platformType}`);
  }

  // 評価結果を返却
  return {
    ...MOCK_EVALUATION_RESULT,
    categories: filteredCategories,
    metadata: {
      ...MOCK_EVALUATION_RESULT.metadata,
      evaluatedAt: new Date(), // 現在の日時を設定
    },
  };
}
