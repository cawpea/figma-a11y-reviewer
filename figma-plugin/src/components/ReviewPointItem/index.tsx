import type { DropdownOption } from '@create-figma-plugin/ui';
import { Checkbox, Dropdown } from '@create-figma-plugin/ui';
import { h } from 'preact';

import type { AgentOption } from '../../constants/agents';

interface ReviewPointItemProps {
  agent: AgentOption;
  checked: boolean;
  onChange: (agentId: string, checked: boolean) => void;
  selectedPlatform?: string;
  onPlatformChange?: (platform: 'ios' | 'android') => void;
}

const platformOptions: DropdownOption[] = [
  { value: 'ios', text: 'iOS (Human Interface Guidelines)' },
  { value: 'android', text: 'Android (Material Design)' },
];

export default function ReviewPointItem({
  agent,
  checked,
  onChange,
  selectedPlatform,
  onPlatformChange,
}: ReviewPointItemProps) {
  const showPlatformSelect = agent.id === 'platformCompliance' && checked;

  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-md">
      <Checkbox value={checked} onValueChange={(isChecked) => onChange(agent.id, isChecked)}>
        <div className="flex-1">
          <div className="font-medium text-xs mb-1.5">{agent.label}</div>
          <div className="text-[10px] text-gray-500 leading-tight">{agent.description}</div>
        </div>
      </Checkbox>

      {/* platformCompliance選択時にプラットフォーム選択プルダウンを表示 */}
      {showPlatformSelect && (
        <div className="mt-2 ml-6">
          <Dropdown
            value={selectedPlatform || 'ios'}
            options={platformOptions}
            onValueChange={(value) => onPlatformChange?.(value as 'ios' | 'android')}
          />
        </div>
      )}
    </div>
  );
}
