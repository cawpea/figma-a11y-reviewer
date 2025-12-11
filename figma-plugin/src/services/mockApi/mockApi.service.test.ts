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
      evaluationTypes: ['accessibility', 'writing'],
      delay: 0,
    });

    expect(result.categories.accessibility).toBeDefined();
    expect(result.categories.writing).toBeDefined();
  });

  it('evaluationTypesが未指定の場合は全カテゴリを返す', async () => {
    const result = await callMockEvaluationAPI({ delay: 0 });

    expect(Object.keys(result.categories)).toHaveLength(3);
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

    // 2回目: writingのみ
    const result2 = await callMockEvaluationAPI({
      evaluationTypes: ['writing'],
      delay: 0,
    });

    // 3回目: フィルタなし
    const result3 = await callMockEvaluationAPI({ delay: 0 });

    // 各結果が独立していることを確認
    expect(result1.categories.accessibility).toBeDefined();
    expect(result1.categories.writing).toBeUndefined();

    expect(result2.categories.writing).toBeDefined();
    expect(result2.categories.accessibility).toBeUndefined();

    expect(Object.keys(result3.categories)).toHaveLength(3);
    expect(result3.categories.accessibility).toBeDefined();
    expect(result3.categories.writing).toBeDefined();
  });

  it('返されたデータを変更しても元のデータに影響しない', async () => {
    const result = await callMockEvaluationAPI({ delay: 0 });

    // 返されたデータを変更
    result.categories.accessibility.issues[0].message = 'Modified message';
    delete result.categories.writing;

    // 再度取得して、元のデータが変更されていないことを確認
    const result2 = await callMockEvaluationAPI({ delay: 0 });

    expect(result2.categories.accessibility.issues[0].message).not.toBe('Modified message');
    expect(result2.categories.writing).toBeDefined();
  });
});
