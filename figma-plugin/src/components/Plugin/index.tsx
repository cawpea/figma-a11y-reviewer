import { h } from 'preact';

import { AGENT_TIME_ESTIMATE, agentOptions } from '../../constants/agents';
import Checkbox from '../Checkbox';
import ControlPanel from '../ControlPanel';
import ErrorDisplay from '../ErrorDisplay';
import LoadingSpinner from '../LoadingSpinner';
import ResultView from '../ResultView';
import ReviewPointItem from '../ReviewPointItem';
import SelectionDisplay from '../SelectionDisplay';

import { useAgentSelection } from './hooks/useAgentSelection';
import { useEvaluation } from './hooks/useEvaluation';

import '!../../output.css';

export default function Plugin() {
  const {
    selectedAgents,
    selectedPlatform,
    handleAgentChange,
    handlePlatformChange,
    handleSelectAll,
    handleDeselectAll,
  } = useAgentSelection(agentOptions);

  const { error, isLoading, result, handleEvaluate, handleIssueClick } = useEvaluation();

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

  return (
    <div className="font-inter text-xs p-4 text-gray-800 bg-white h-full">
      <SelectionDisplay />

      <ControlPanel selectedAgentsCount={selectedAgents.length} onEvaluate={onEvaluate} />

      {/* レビュー項目セクション */}
      <div className="mb-5">
        {/* 見出しと選択数 */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm">レビュー項目</h3>
          <span className="text-xs text-gray-500">
            {selectedAgents.length} / {agentOptions.length}
          </span>
        </div>

        {/* すべて選択チェックボックス */}
        <div className="mb-2 p-3 bg-gray-50 rounded-md">
          <div className="flex items-start gap-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAllToggle}
            />
            <label htmlFor="select-all" className="flex-1 font-medium text-xs cursor-pointer">
              すべて選択
            </label>
          </div>
        </div>

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
      </div>

      <ErrorDisplay error={error} />

      {isLoading && (
        <LoadingSpinner selectedAgentsCount={selectedAgents.length} estimatedTime={estimatedTime} />
      )}

      {result && <ResultView result={result} onIssueClick={handleIssueClick} />}
    </div>
  );
}
