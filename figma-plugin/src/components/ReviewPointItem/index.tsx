import type { DropdownOption } from '@create-figma-plugin/ui';
import { Checkbox, Dropdown } from '@create-figma-plugin/ui';
import { h } from 'preact';

import type { AgentOption } from '../../constants/agents';
import TextboxMultilineWithLimit from '../TextboxMultiline';

interface ReviewPointItemProps {
  agent: AgentOption;
  checked: boolean;
  onChange: (agentId: string, checked: boolean) => void;
  selectedPlatform?: string;
  onPlatformChange?: (platform: 'ios' | 'android') => void;
  userContext?: string;
  onUserContextChange?: (context: string, options: { isOverLimit: boolean }) => void;
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
  userContext,
  onUserContextChange,
}: ReviewPointItemProps) {
  const showPlatformSelect = agent.id === 'platformCompliance' && checked;
  const showUserContextInput = agent.id === 'usability' && checked;

  return (
    <div className="mb-3 p-3 border border-gray-300 rounded-md">
      <Checkbox value={checked} onValueChange={(isChecked) => onChange(agent.id, isChecked)}>
        <div className="flex-1 relative top-[-3px]">
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

      {/* usability選択時にユーザーコンテキスト入力を表示 */}
      {showUserContextInput && (
        <div className="mt-2 ml-6">
          <label className="text-[10px] text-gray-600 font-bold mb-1" htmlFor="userContext">
            想定ユーザーと利用文脈（任意）
          </label>
          <TextboxMultilineWithLimit
            id="userContext"
            value={userContext || ''}
            limit={100}
            onValueInput={onUserContextChange}
            placeholder="ECサイトで買い物をする40代のユーザー。通勤中にスマートフォンで商品を閲覧することが多い。"
          />
        </div>
      )}
    </div>
  );
}
