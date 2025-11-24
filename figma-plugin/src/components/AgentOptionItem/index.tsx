import { h } from 'preact';

import type { AgentOption } from '../../constants/agents';
import Checkbox from '../Checkbox';
import Select, { type SelectOption } from '../Select';

interface AgentOptionItemProps {
  agent: AgentOption;
  checked: boolean;
  onChange: (agentId: string, checked: boolean) => void;
  selectedPlatform?: string;
  onPlatformChange?: (platform: 'ios' | 'android') => void;
}

const platformOptions: SelectOption[] = [
  { value: 'ios', label: 'iOS (Human Interface Guidelines)' },
  { value: 'android', label: 'Android (Material Design)' },
];

export default function AgentOptionItem({
  agent,
  checked,
  onChange,
  selectedPlatform,
  onPlatformChange,
}: AgentOptionItemProps) {
  const showPlatformSelect = agent.id === 'platformCompliance' && checked;

  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-md">
      <div className="flex items-start gap-2 mb-1.5">
        <Checkbox
          id={`agent-${agent.id}`}
          checked={checked}
          onChange={(isChecked) => onChange(agent.id, isChecked)}
        />
        <label htmlFor={`agent-${agent.id}`} className="flex-1 font-medium text-xs cursor-pointer">
          {agent.label}
        </label>
      </div>
      <div className="text-[10px] text-gray-500 leading-tight ml-6">{agent.description}</div>

      {/* platformCompliance選択時にプラットフォーム選択プルダウンを表示 */}
      {showPlatformSelect && (
        <div className="mt-2 ml-6">
          <Select
            id={`platform-${agent.id}`}
            value={selectedPlatform || 'ios'}
            options={platformOptions}
            onChange={(value) => onPlatformChange?.(value as 'ios' | 'android')}
          />
        </div>
      )}
    </div>
  );
}
