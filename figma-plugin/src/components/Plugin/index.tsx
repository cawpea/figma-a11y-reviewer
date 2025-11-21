import { h } from 'preact';
import { useState } from 'preact/hooks';

import { agentOptions, AGENT_TIME_ESTIMATE } from '../../constants/agents';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import ControlPanel from '../ControlPanel';
import ErrorDisplay from '../ErrorDisplay';
import Header from '../Header';
import LoadingSpinner from '../LoadingSpinner';
import ResultView from '../ResultView';
import SettingsPopover from '../SettingsPopover';

import { useAgentSelection } from './hooks/useAgentSelection';
import { useEvaluation } from './hooks/useEvaluation';

import '!../../output.css';

export default function Plugin() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { selectedAgents, handleAgentChange, handleSelectAll, handleDeselectAll } =
    useAgentSelection(agentOptions);

  const { error, isLoading, result, handleEvaluate, handleIssueClick } = useEvaluation();

  useOutsideClick(isSettingsOpen, () => setIsSettingsOpen(false), [
    '.settings-popover',
    '.settings-btn',
  ]);

  const estimatedTime = selectedAgents.length * AGENT_TIME_ESTIMATE;

  const onEvaluate = () => {
    setIsSettingsOpen(false);
    handleEvaluate(selectedAgents);
  };

  return (
    <div className="font-inter text-xs p-4 text-gray-800 bg-white h-full">
      <Header />

      <ControlPanel
        selectedAgentsCount={selectedAgents.length}
        onEvaluate={onEvaluate}
        onSettingsToggle={() => setIsSettingsOpen(!isSettingsOpen)}
        isSettingsOpen={isSettingsOpen}
      >
        {isSettingsOpen && (
          <SettingsPopover
            selectedAgents={selectedAgents}
            agentOptions={agentOptions}
            onAgentChange={handleAgentChange}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onClose={() => setIsSettingsOpen(false)}
            estimatedTime={estimatedTime}
          />
        )}
      </ControlPanel>

      <ErrorDisplay error={error} />

      {isLoading && (
        <LoadingSpinner selectedAgentsCount={selectedAgents.length} estimatedTime={estimatedTime} />
      )}

      {result && <ResultView result={result} onIssueClick={handleIssueClick} />}
    </div>
  );
}
