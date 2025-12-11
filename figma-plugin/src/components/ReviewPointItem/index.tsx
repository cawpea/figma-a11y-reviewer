import { Checkbox } from '@create-figma-plugin/ui';
import { h } from 'preact';

import type { AgentOption } from '../../constants/agents';

interface ReviewPointItemProps {
  agent: AgentOption;
  checked: boolean;
  onChange: (agentId: string, checked: boolean) => void;
}

export default function ReviewPointItem({
  agent,
  checked,
  onChange,
}: ReviewPointItemProps) {

  return (
    <div className="mb-3 p-3 border border-gray-300 rounded-md">
      <Checkbox value={checked} onValueChange={(isChecked) => onChange(agent.id, isChecked)}>
        <div className="flex-1 relative top-[-3px]">
          <div className="font-medium text-xs mb-1.5">{agent.label}</div>
          <div className="text-[10px] text-gray-500 leading-tight">{agent.description}</div>
        </div>
      </Checkbox>
    </div>
  );
}
