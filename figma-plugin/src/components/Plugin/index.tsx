import { Button, IconAi16 } from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { agentOptions } from '../../constants/agents';
import { useSelectionState } from '../../hooks/useSelectionState';
import ErrorDisplay from '../ErrorDisplay';
import FeatureTogglePanel from '../FeatureTogglePanel';
import Heading from '../Heading';
import LoadingView from '../LoadingView';
import ReviewResultView from '../ReviewResultView';
import SelectionDisplay from '../SelectionDisplay';
import WCAGLevelSelector from '../WCAGLevelSelector';

import { useEvaluation } from './hooks/useEvaluation';
import { useWCAGLevelSelection } from './hooks/useWCAGLevelSelection';

import '!../../output.css';

export default function Plugin() {
  const [view, setView] = useState<'initial' | 'result'>('initial');
  const selectionState = useSelectionState();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { wcagLevel, handleWCAGLevelChange } = useWCAGLevelSelection();

  // WCAG基準に基づいてエージェントIDを自動決定
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  useEffect(() => {
    const agentId = `accessibility-${wcagLevel.toLowerCase()}`;
    setSelectedAgents([agentId]);
  }, [wcagLevel]);

  const handleBackToInitial = useCallback(() => {
    setView('initial');
  }, []);

  const { error, isLoading, result, handleEvaluate, handleIssueClick } = useEvaluation({
    onEvaluationComplete: () => {
      setView('result');
    },
  });

  const onEvaluate = () => {
    // 検証エラーをクリアしてから評価開始
    setValidationError(null);
    handleEvaluate(selectedAgents);
  };

  // 選択されたエージェントの情報を取得
  const selectedAgentInfo = agentOptions.find((agent) => agent.id === selectedAgents[0]);

  // レビュー開始ボタンの無効化条件
  const shouldDisableButton = selectedAgents.length === 0;

  // 結果ページ表示
  if (view === 'result' && result) {
    return (
      <ReviewResultView
        result={result}
        selectedLayers={selectionState.layers}
        onClose={handleBackToInitial}
        onIssueClick={handleIssueClick}
      />
    );
  }

  // 初期ページ表示
  return (
    <div className="font-inter text-xs p-4 text-gray-800 bg-white flex flex-col gap-5">
      <SelectionDisplay selectionState={selectionState} />

      {/* WCAG基準選択セクション */}
      <section>
        <Heading>WCAG基準</Heading>
        <WCAGLevelSelector wcagLevel={wcagLevel} onChange={handleWCAGLevelChange} />
      </section>

      {/* 選択されたエージェント情報 */}
      {selectedAgentInfo && (
        <section>
          <Heading>評価内容</Heading>
          <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded">
            <span className="text-xs font-medium text-gray-800">{selectedAgentInfo.label}</span>
            <span className="text-xs text-gray-600">{selectedAgentInfo.description}</span>
          </div>
        </section>
      )}

      {/* AIによるレビューを開始ボタン */}
      <section>
        <div className="flex flex-col gap-3">
          <ErrorDisplay error={validationError || error} />
          <Button
            onClick={onEvaluate}
            disabled={shouldDisableButton}
            fullWidth
            style={{ height: '32px' }}
          >
            <IconAi16 className="inline-block mr-1 align-middle" aria-hidden="true" />
            <span className="align-middle">AIによるレビューを開始</span>
          </Button>
        </div>
      </section>

      {isLoading && <LoadingView />}

      {/* 機能トグルパネル（開発環境のみ） */}
      <FeatureTogglePanel />
    </div>
  );
}
