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
});
