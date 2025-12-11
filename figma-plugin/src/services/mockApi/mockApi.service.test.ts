import { callMockEvaluationAPI } from './mockApi.service';

describe('callMockEvaluationAPI', () => {
  it('遅延後にモックデータを返す', async () => {
    const startTime = Date.now();
    const result = await callMockEvaluationAPI({ delay: 100 });
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeGreaterThanOrEqual(100);
    expect(result.categories).toBeDefined();
    expect(result.metadata.evaluatedAt).toBeInstanceOf(Date);
  });

  it('evaluationTypesでフィルタリングする', async () => {
    const result = await callMockEvaluationAPI({
      evaluationTypes: ['accessibility'],
      delay: 0,
    });

    expect(result.categories.accessibility).toBeDefined();
  });

  it('evaluationTypesが未指定の場合は全カテゴリを返す', async () => {
    const result = await callMockEvaluationAPI({ delay: 0 });

    expect(Object.keys(result.categories)).toHaveLength(1);
  });

  it('複数回呼び出しても元のデータが変更されない（ディープコピー検証）', async () => {
    // 1回目: accessibilityのみ
    const result1 = await callMockEvaluationAPI({
      evaluationTypes: ['accessibility'],
      delay: 0,
    });

    // 2回目: フィルタなし
    const result2 = await callMockEvaluationAPI({ delay: 0 });

    // 各結果が独立していることを確認
    expect(result1.categories.accessibility).toBeDefined();

    expect(Object.keys(result2.categories)).toHaveLength(1);
    expect(result2.categories.accessibility).toBeDefined();
  });

  it('返されたデータを変更しても元のデータに影響しない', async () => {
    const result = await callMockEvaluationAPI({ delay: 0 });

    // 返されたデータを変更
    result.categories.accessibility.issues[0].message = 'Modified message';

    // 再度取得して、元のデータが変更されていないことを確認
    const result2 = await callMockEvaluationAPI({ delay: 0 });

    expect(result2.categories.accessibility.issues[0].message).not.toBe('Modified message');
  });
});
