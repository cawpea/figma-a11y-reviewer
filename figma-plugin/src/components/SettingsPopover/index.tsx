import { h } from 'preact';

import type { AgentOption } from '../../constants/agents';
import AgentOptionItem from '../AgentOptionItem';
import Button from '../Button';
import TimeEstimate from '../TimeEstimate';

interface SettingsPopoverProps {
  selectedAgents: string[];
  agentOptions: AgentOption[];
  onAgentChange: (agentId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClose: () => void;
  estimatedTime: number;
}

export default function SettingsPopover({
  selectedAgents,
  agentOptions,
  onAgentChange,
  onSelectAll,
  onDeselectAll,
  onClose,
  estimatedTime,
}: SettingsPopoverProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80 max-h-96 overflow-y-auto settings-popover">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-[13px]">評価項目の選択</span>
        <button
          onClick={onClose}
          className="bg-none border-none w-auto p-1 cursor-pointer text-gray-400 hover:text-gray-700 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* エージェントオプション */}
      {agentOptions.map((agent) => (
        <AgentOptionItem
          key={agent.id}
          agent={agent}
          checked={selectedAgents.includes(agent.id)}
          onChange={onAgentChange}
        />
      ))}

      {/* アクション */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
        <Button onClick={onSelectAll} variant="secondary">
          全選択
        </Button>
        <Button onClick={onDeselectAll} variant="secondary">
          全解除
        </Button>
      </div>

      {/* 選択情報 */}
      <TimeEstimate
        selectedCount={selectedAgents.length}
        secondsPerAgent={estimatedTime / selectedAgents.length || 30}
      />
    </div>
  );
}
