import { h } from 'preact';
import Checkbox from '../Checkbox';
import type { AgentOption } from '../../constants/agents';

interface AgentOptionItemProps {
  agent: AgentOption;
  checked: boolean;
  onChange: (agentId: string, checked: boolean) => void;
}

export default function AgentOptionItem({ agent, checked, onChange }: AgentOptionItemProps) {
  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-md">
      <div className="flex items-start gap-2 mb-1.5">
        <Checkbox
          id={`agent-${agent.id}`}
          checked={checked}
          onChange={(isChecked) => onChange(agent.id, isChecked)}
        />
        <label
          htmlFor={`agent-${agent.id}`}
          className="flex-1 font-medium text-xs cursor-pointer"
        >
          {agent.label}
        </label>
      </div>
      <div className="text-[10px] text-gray-500 leading-tight ml-6">
        {agent.description}
      </div>
    </div>
  );
}
