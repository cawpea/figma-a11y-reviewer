import { emit, on } from '@create-figma-plugin/utilities';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { type AgentOption } from '../../../constants/agents';

interface UseAgentSelectionReturn {
  selectedAgents: string[];
  selectedPlatform: 'ios' | 'android';
  handleAgentChange: (agentId: string, checked: boolean) => void;
  handlePlatformChange: (platform: 'ios' | 'android') => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
}

export function useAgentSelection(agentOptions: AgentOption[]): UseAgentSelectionReturn {
  const [selectedAgents, setSelectedAgents] = useState<string[]>(
    agentOptions.map((agent) => agent.id)
  );
  const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android'>('ios');

  // 初期化:保存された選択状態を復元
  useEffect(() => {
    const handleAgentSelectionLoaded = ({
      selectedAgents: savedAgents,
      selectedPlatform: savedPlatform,
    }: {
      selectedAgents: string[] | null;
      selectedPlatform: 'ios' | 'android' | null;
    }) => {
      if (savedAgents && Array.isArray(savedAgents)) {
        setSelectedAgents(savedAgents);
      }

      if (savedPlatform === 'ios' || savedPlatform === 'android') {
        setSelectedPlatform(savedPlatform);
      }
    };

    on('AGENT_SELECTION_LOADED', handleAgentSelectionLoaded);
    emit('LOAD_AGENT_SELECTION');

    return () => {
      // クリーンアップ（ハンドラーの登録解除）
      // Note: @create-figma-plugin/utilities の on() は登録解除の仕組みを提供していないため、
      // 複数回マウントされる場合に重複して実行される可能性がある
    };
  }, []);

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

  // プラットフォーム変更ハンドラー
  const handlePlatformChange = useCallback((platform: 'ios' | 'android') => {
    setSelectedPlatform(platform);
    emit('SAVE_PLATFORM_SELECTION', platform);
  }, []);

  return {
    selectedAgents,
    selectedPlatform,
    handleAgentChange,
    handlePlatformChange,
    handleSelectAll,
    handleDeselectAll,
  };
}
