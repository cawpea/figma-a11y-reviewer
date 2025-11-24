import { useCallback, useEffect, useState } from 'preact/hooks';

import { PLATFORM_STORAGE_KEY, STORAGE_KEY, type AgentOption } from '../../../constants/agents';

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

  // 初期化：保存された選択状態を復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedAgents(JSON.parse(saved));
      }

      const savedPlatform = localStorage.getItem(PLATFORM_STORAGE_KEY);
      if (savedPlatform === 'ios' || savedPlatform === 'android') {
        setSelectedPlatform(savedPlatform);
      }
    } catch (e) {
      console.error('Failed to load agent selection:', e);
    }
  }, []);

  // 選択状態を保存
  const saveAgentSelection = useCallback((agents: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
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
    try {
      localStorage.setItem(PLATFORM_STORAGE_KEY, platform);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
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
