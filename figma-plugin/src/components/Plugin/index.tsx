import { Button, Checkbox } from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useCallback, useState } from 'preact/hooks';

import { agentOptions } from '../../constants/agents';
import { useSelectionState } from '../../hooks/useSelectionState';
import ErrorDisplay from '../ErrorDisplay';
import FeatureTogglePanel from '../FeatureTogglePanel';
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
    <div className="font-inter text-xs p-4 text-gray-800 bg-white flex flex-col gap-5">
      <SelectionDisplay selectionState={selectionState} />

      {/* レビュー項目セクション */}
      <section>
        {/* 見出しと選択数 */}
        <Heading
          rightContent={
            <div className="flex items-center gap-3">
              {/* すべて選択チェックボックス */}
              <Checkbox value={allSelected} onValueChange={handleSelectAllToggle}>
                <div className="relative top-[-3px]">
                  <span className="font-medium text-xs">すべて選択</span>
                </div>
              </Checkbox>
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

        {/* レビューを実行ボタン */}
        <Button
          onClick={onEvaluate}
          disabled={selectedAgents.length === 0}
          fullWidth
          style={{ height: '32px' }}
        >
          レビューを実行
        </Button>
      </section>

      <ErrorDisplay error={error} />

      {isLoading && <LoadingView />}

      {/* 機能トグルパネル（開発環境のみ） */}
      <FeatureTogglePanel />
    </div>
  );
}
