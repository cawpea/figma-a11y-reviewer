import { emit, on } from '@create-figma-plugin/utilities';
import { useCallback, useEffect, useState } from 'preact/hooks';

import type { EvaluationResult, Issue } from '../../../../../shared/src/types';

interface UseEvaluationReturn {
  error: string;
  isLoading: boolean;
  result: EvaluationResult | null;
  handleEvaluate: (selectedAgents: string[], platformType?: 'ios' | 'android') => void;
  handleIssueClick: (issue: Issue, rootNodeId?: string) => void;
}

export function useEvaluation(): UseEvaluationReturn {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // プラグインメッセージ受信
  useEffect(() => {
    const unsubscribeError = on('ERROR', (message: string) => {
      setError(message);
      setIsLoading(false);
      setResult(null);
    });

    const unsubscribeEvaluationStarted = on('EVALUATION_STARTED', () => {
      setIsLoading(true);
      setError('');
      setResult(null);
    });

    const unsubscribeEvaluationComplete = on('EVALUATION_COMPLETE', (result: EvaluationResult) => {
      setIsLoading(false);
      setError('');
      setResult(result);
    });

    return () => {
      unsubscribeError();
      unsubscribeEvaluationStarted();
      unsubscribeEvaluationComplete();
    };
  }, []);

  // 評価開始
  const handleEvaluate = useCallback(
    (selectedAgents: string[], platformType?: 'ios' | 'android') => {
      if (selectedAgents.length === 0) {
        setError('評価項目を1つ以上選択してください');
        return;
      }

      emit('EVALUATE_SELECTION', selectedAgents, platformType);
    },
    []
  );

  // Issue クリックハンドラー
  const handleIssueClick = useCallback((issue: Issue, rootNodeId?: string) => {
    const targetNodeId = issue.nodeId || rootNodeId;

    if (targetNodeId) {
      emit('SELECT_NODE', {
        nodeId: targetNodeId,
        nodeHierarchy: issue.nodeHierarchy,
        rootNodeId: rootNodeId,
      });
    }
  }, []);

  return {
    error,
    isLoading,
    result,
    handleEvaluate,
    handleIssueClick,
  };
}
