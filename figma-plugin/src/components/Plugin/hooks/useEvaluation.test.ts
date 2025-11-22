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

  it('initializes with default values', () => {
    const { result } = renderHook(() => useEvaluation());

    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('sets up event listeners on mount', () => {
    renderHook(() => useEvaluation());

    expect(mockOn).toHaveBeenCalledWith('ERROR', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('EVALUATION_STARTED', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('EVALUATION_COMPLETE', expect.any(Function));
  });

  describe('handleEvaluate', () => {
    it('emits EVALUATE_SELECTION with selected agents', () => {
      const { result } = renderHook(() => useEvaluation());

      act(() => {
        result.current.handleEvaluate(['accessibility', 'designSystem']);
      });

      expect(mockEmit).toHaveBeenCalledWith('EVALUATE_SELECTION', [
        'accessibility',
        'designSystem',
      ]);
    });

    it('sets error when no agents are selected', () => {
      const { result } = renderHook(() => useEvaluation());

      act(() => {
        result.current.handleEvaluate([]);
      });

      expect(result.current.error).toBe('評価項目を1つ以上選択してください');
      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('sets error and clears loading state on ERROR event', async () => {
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

  describe('EVALUATION_STARTED event', () => {
    it('sets loading state and clears error', async () => {
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

  describe('EVALUATION_COMPLETE event', () => {
    it('sets result and clears loading state', async () => {
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
    it('emits SELECT_NODE with nodeId when issue has nodeId', () => {
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

    it('emits SELECT_NODE with rootNodeId when issue has no nodeId', () => {
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

    it('does not emit when no nodeId or rootNodeId', () => {
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
