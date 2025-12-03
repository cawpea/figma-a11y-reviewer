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
      evaluationTypes: ['accessibility', 'usability'],
      delay: 0,
    });

    expect(result.categories.accessibility).toBeDefined();
    expect(result.categories.usability).toBeDefined();
    expect(result.categories.styleConsistency).toBeUndefined();
  });

  it('evaluationTypesが未指定の場合は全カテゴリを返す', async () => {
    const result = await callMockEvaluationAPI({ delay: 0 });

    expect(Object.keys(result.categories)).toHaveLength(5);
  });

  it('platformTypeをログ出力する', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await callMockEvaluationAPI({ platformType: 'ios', delay: 0 });

    expect(consoleSpy).toHaveBeenCalledWith('[Mock API] Platform type: ios');
  });

  it('複数回呼び出しても元のデータが変更されない（ディープコピー検証）', async () => {
    // 1回目: accessibilityのみ
    const result1 = await callMockEvaluationAPI({
      evaluationTypes: ['accessibility'],
      delay: 0,
    });

    // 2回目: usabilityのみ
    const result2 = await callMockEvaluationAPI({
      evaluationTypes: ['usability'],
      delay: 0,
    });

    // 3回目: フィルタなし
    const result3 = await callMockEvaluationAPI({ delay: 0 });

    // 各結果が独立していることを確認
    expect(result1.categories.accessibility).toBeDefined();
    expect(result1.categories.usability).toBeUndefined();

    expect(result2.categories.usability).toBeDefined();
    expect(result2.categories.accessibility).toBeUndefined();

    expect(Object.keys(result3.categories)).toHaveLength(5);
    expect(result3.categories.accessibility).toBeDefined();
    expect(result3.categories.usability).toBeDefined();
  });

  it('返されたデータを変更しても元のデータに影響しない', async () => {
    const result = await callMockEvaluationAPI({ delay: 0 });

    // 返されたデータを変更
    result.categories.accessibility.issues[0].message = 'Modified message';
    delete result.categories.usability;

    // 再度取得して、元のデータが変更されていないことを確認
    const result2 = await callMockEvaluationAPI({ delay: 0 });

    expect(result2.categories.accessibility.issues[0].message).not.toBe('Modified message');
    expect(result2.categories.usability).toBeDefined();
  });
});
