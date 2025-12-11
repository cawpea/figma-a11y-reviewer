import { emit, on } from '@create-figma-plugin/utilities';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { type AgentOption } from '../../../constants/agents';

interface UseAgentSelectionReturn {
  selectedAgents: string[];
  handleAgentChange: (agentId: string, checked: boolean) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
}

export function useAgentSelection(agentOptions: AgentOption[]): UseAgentSelectionReturn {
  // 初期状態は空配列（ちらつき防止）
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // 初期化:保存された選択状態を復元
  useEffect(() => {
    const handleAgentSelectionLoaded = ({
      selectedAgents: savedAgents,
    }: {
      selectedAgents: string[] | null;
    }) => {
      // 保存された選択状態がある場合は復元（空の配列も含む）
      if (savedAgents !== null && Array.isArray(savedAgents)) {
        setSelectedAgents(savedAgents);
      } else {
        // 保存された選択状態がない場合（null）はすべて選択
        setSelectedAgents(agentOptions.map((agent) => agent.id));
      }
    };

    on('AGENT_SELECTION_LOADED', handleAgentSelectionLoaded);
    emit('LOAD_AGENT_SELECTION');

    return () => {
      // クリーンアップ（ハンドラーの登録解除）
      // Note: @create-figma-plugin/utilities の on() は登録解除の仕組みを提供していないため、
      // 複数回マウントされる場合に重複して実行される可能性がある
    };
  }, [agentOptions]);

  // 選択状態を保存
  const saveAgentSelection = useCallback((agents: string[]) => {
    emit('SAVE_AGENT_SELECTION', agents);
  }, []);

  // チェックボックス変更ハンドラー
  const handleAgentChange = useCallback(
    (agentId: string, checked: boolean) => {
      const newSelection = checked
        ? [...selectedAgents, agentId]
        : selectedAgents.filter((id) => id !== agentId);

      setSelectedAgents(newSelection);
      saveAgentSelection(newSelection);
    },
    [selectedAgents, saveAgentSelection]
  );

  // 全選択
  const handleSelectAll = useCallback(() => {
    const allAgents = agentOptions.map((agent) => agent.id);
    setSelectedAgents(allAgents);
    saveAgentSelection(allAgents);
  }, [agentOptions, saveAgentSelection]);

  // 全解除
  const handleDeselectAll = useCallback(() => {
    setSelectedAgents([]);
    saveAgentSelection([]);
  }, [saveAgentSelection]);

  return {
    selectedAgents,
    handleAgentChange,
    handleSelectAll,
    handleDeselectAll,
  };
}
