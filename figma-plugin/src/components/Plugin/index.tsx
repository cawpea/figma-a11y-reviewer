import { h } from 'preact';
import { useCallback, useState } from 'preact/hooks';

import { AGENT_TIME_ESTIMATE, agentOptions } from '../../constants/agents';
import { useSelectionState } from '../../hooks/useSelectionState';
import Button from '../Button';
import Checkbox from '../Checkbox';
import ErrorDisplay from '../ErrorDisplay';
import Heading from '../Heading';
import LoadingView from '../LoadingView';
import ReviewPointItem from '../ReviewPointItem';
import ReviewResultView from '../ReviewResultView';
import SelectionDisplay from '../SelectionDisplay';

import { useAgentSelection } from './hooks/useAgentSelection';
import { useEvaluation } from './hooks/useEvaluation';

import '!../../output.css';

export default function Plugin() {
  const [view, setView] = useState<'initial' | 'result'>('initial');
  const selectionState = useSelectionState();

  const {
    selectedAgents,
    selectedPlatform,
    handleAgentChange,
    handlePlatformChange,
    handleSelectAll,
    handleDeselectAll,
  } = useAgentSelection(agentOptions);

  const handleBackToInitial = useCallback(() => {
    setView('initial');
  }, []);

  const { error, isLoading, result, handleEvaluate, handleIssueClick } = useEvaluation({
    onEvaluationComplete: () => {
      setView('result');
    },
  });

  const estimatedTime = selectedAgents.length * AGENT_TIME_ESTIMATE;

  const onEvaluate = () => {
    handleEvaluate(selectedAgents, selectedPlatform);
  };

  const allSelected = selectedAgents.length === agentOptions.length;
  const someSelected = selectedAgents.length > 0 && selectedAgents.length < agentOptions.length;

  const handleSelectAllToggle = (checked: boolean) => {
    if (checked || someSelected) {
      handleSelectAll();
    } else {
      handleDeselectAll();
    }
  };

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
    <div className="font-inter text-xs p-4 text-gray-800 bg-white h-full">
      <SelectionDisplay selectionState={selectionState} />

      {/* レビュー項目セクション */}
      <div className="mb-5">
        {/* 見出しと選択数 */}
        <Heading
          rightContent={
            <div className="flex items-center gap-3">
              {/* すべて選択チェックボックス */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAllToggle}
                />
                <label htmlFor="select-all" className="font-medium text-xs cursor-pointer">
                  すべて選択
                </label>
              </div>
              {/* 選択数 */}
              <span className="text-xs text-gray-500">
                {selectedAgents.length} / {agentOptions.length}
              </span>
            </div>
          }
        >
          レビュー項目
        </Heading>

        {/* 評価項目リスト */}
        {agentOptions.map((agent) => (
          <ReviewPointItem
            key={agent.id}
            agent={agent}
            checked={selectedAgents.includes(agent.id)}
            onChange={handleAgentChange}
            selectedPlatform={selectedPlatform}
            onPlatformChange={handlePlatformChange}
          />
        ))}

        {/* 評価を開始ボタン */}
        <Button
          onClick={onEvaluate}
          disabled={selectedAgents.length === 0}
          variant="primary"
          className="w-full"
        >
          評価を開始
        </Button>
      </div>

      <ErrorDisplay error={error} />

      {isLoading && (
        <LoadingView selectedAgentsCount={selectedAgents.length} estimatedTime={estimatedTime} />
      )}
    </div>
  );
}
