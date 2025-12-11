import type { EvaluationResult } from '@shared/types';

import { MOCK_EVALUATION_RESULT } from './mockData';

export interface MockApiOptions {
  evaluationTypes?: string[];
  delay?: number; // ネットワーク遅延のシミュレーション（ミリ秒）
}

/**
 * モックAPI評価サービス
 *
 * バックエンドAPIを呼び出さずにモックデータを返します。
 * ネットワーク遅延をシミュレートし、リアルな動作確認が可能です。
 *
 * @param options - モックAPIのオプション
 * @param options.evaluationTypes - 評価タイプのフィルタ（例: ['accessibility', 'writing']）
 * @param options.delay - シミュレートする遅延時間（デフォルト: 1500ms）
 * @returns 評価結果（EvaluationResult）
 */
export async function callMockEvaluationAPI(
  options: MockApiOptions = {}
): Promise<EvaluationResult> {
  const { evaluationTypes, delay = 1500 } = options;

  // ネットワーク遅延をシミュレート
  await new Promise((resolve) => setTimeout(resolve, delay));

  // ディープコピーを作成（JSON経由で参照を完全に分離）
  const resultCopy: typeof MOCK_EVALUATION_RESULT = JSON.parse(
    JSON.stringify(MOCK_EVALUATION_RESULT)
  );

  // evaluationTypesが指定されている場合、選択されたカテゴリのみ返す
  if (evaluationTypes && evaluationTypes.length > 0) {
    const filteredCategories: typeof resultCopy.categories = {};
    evaluationTypes.forEach((type) => {
      if (resultCopy.categories[type]) {
        filteredCategories[type] = resultCopy.categories[type];
      }
    });
    resultCopy.categories = filteredCategories;
  }

  // 評価結果を返却
  return {
    ...resultCopy,
    metadata: {
      ...resultCopy.metadata,
      evaluatedAt: new Date(), // 現在の日時を設定
    },
  };
}
