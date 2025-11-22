import { emit, on } from '@create-figma-plugin/utilities';
import type { EvaluationResult } from '@shared/types';
import { act, renderHook, waitFor } from '@testing-library/preact';

import { useEvaluation } from './useEvaluation';

jest.mock('@create-figma-plugin/utilities');

const mockEmit = emit as jest.MockedFunction<typeof emit>;
const mockOn = on as jest.MockedFunction<typeof on>;

describe('useEvaluation', () => {
  let errorHandler: ((message: string) => void) | null = null;
  let evaluationStartedHandler: (() => void) | null = null;
  let evaluationCompleteHandler: ((result: EvaluationResult) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();

    // onモックのセットアップ
    mockOn.mockImplementation((event: string, handler: any) => {
      if (event === 'ERROR') {
        errorHandler = handler;
      } else if (event === 'EVALUATION_STARTED') {
        evaluationStartedHandler = handler;
      } else if (event === 'EVALUATION_COMPLETE') {
        evaluationCompleteHandler = handler;
      }
      return jest.fn(); // unsubscribe function
    });
  });

  afterEach(() => {
    errorHandler = null;
    evaluationStartedHandler = null;
    evaluationCompleteHandler = null;
  });

  it('デフォルト値で初期化される', () => {
    const { result } = renderHook(() => useEvaluation());

    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('マウント時にイベントリスナーを設定する', () => {
    renderHook(() => useEvaluation());

    expect(mockOn).toHaveBeenCalledWith('ERROR', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('EVALUATION_STARTED', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('EVALUATION_COMPLETE', expect.any(Function));
  });

  describe('handleEvaluate', () => {
    it('選択されたエージェントとともにEVALUATE_SELECTIONを発行する', () => {
      const { result } = renderHook(() => useEvaluation());

      act(() => {
        result.current.handleEvaluate(['accessibility', 'styleConsistency']);
      });

      expect(mockEmit).toHaveBeenCalledWith('EVALUATE_SELECTION', [
        'accessibility',
        'styleConsistency',
      ]);
    });

    it('エージェントが選択されていないときにエラーを設定する', () => {
      const { result } = renderHook(() => useEvaluation());

      act(() => {
        result.current.handleEvaluate([]);
      });

      expect(result.current.error).toBe('評価項目を1つ以上選択してください');
      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('ERRORイベントでエラーを設定しローディング状態をクリアする', async () => {
      const { result } = renderHook(() => useEvaluation());

      // Start loading first
      act(() => {
        if (evaluationStartedHandler) evaluationStartedHandler();
      });

      expect(result.current.isLoading).toBe(true);

      // Then receive error
      act(() => {
        if (errorHandler) errorHandler('Test error message');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Test error message');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.result).toBeNull();
      });
    });
  });

  describe('EVALUATION_STARTEDイベント', () => {
    it('ローディング状態を設定しエラーをクリアする', async () => {
      const { result } = renderHook(() => useEvaluation());

      // Set initial error
      act(() => {
        result.current.handleEvaluate([]);
      });

      expect(result.current.error).toBeTruthy();

      // Start evaluation
      act(() => {
        if (evaluationStartedHandler) evaluationStartedHandler();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.error).toBe('');
        expect(result.current.result).toBeNull();
      });
    });
  });

  describe('EVALUATION_COMPLETEイベント', () => {
    it('結果を設定しローディング状態をクリアする', async () => {
      const { result } = renderHook(() => useEvaluation());

      const mockResult: EvaluationResult = {
        overallScore: 85,
        categories: {
          accessibility: {
            score: 90,
            issues: [],
          },
        },
        suggestions: [],
        metadata: {
          evaluatedAt: new Date(),
          duration: 1000,
          rootNodeId: '1:1',
          usage: {
            totalInputTokens: 100,
            totalOutputTokens: 50,
            totalCachedTokens: 0,
            estimatedCost: 0.001,
          },
        },
      };

      act(() => {
        if (evaluationCompleteHandler) evaluationCompleteHandler(mockResult);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('');
        expect(result.current.result).toEqual(mockResult);
      });
    });
  });

  describe('handleIssueClick', () => {
    it('問題にnodeIdがあるときnodeIdとともにSELECT_NODEを発行する', () => {
      const { result } = renderHook(() => useEvaluation());

      const issue = {
        severity: 'high' as const,
        message: 'Test issue',
        nodeId: '1:2',
        nodeHierarchy: ['1:1', '1:2'],
        autoFixable: false,
        suggestion: 'Fix this',
      };

      act(() => {
        result.current.handleIssueClick(issue, '1:1');
      });

      expect(mockEmit).toHaveBeenCalledWith('SELECT_NODE', {
        nodeId: '1:2',
        nodeHierarchy: ['1:1', '1:2'],
        rootNodeId: '1:1',
      });
    });

    it('問題にnodeIdがないときrootNodeIdとともにSELECT_NODEを発行する', () => {
      const { result } = renderHook(() => useEvaluation());

      const issue = {
        severity: 'medium' as const,
        message: 'Test issue',
        autoFixable: false,
        suggestion: 'Fix this',
      };

      act(() => {
        result.current.handleIssueClick(issue, '1:1');
      });

      expect(mockEmit).toHaveBeenCalledWith('SELECT_NODE', {
        nodeId: '1:1',
        nodeHierarchy: undefined,
        rootNodeId: '1:1',
      });
    });

    it('nodeIdもrootNodeIdもないときは発行しない', () => {
      const { result } = renderHook(() => useEvaluation());

      const issue = {
        severity: 'low' as const,
        message: 'Test issue',
        autoFixable: false,
        suggestion: 'Fix this',
      };

      act(() => {
        result.current.handleIssueClick(issue);
      });

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });
});
