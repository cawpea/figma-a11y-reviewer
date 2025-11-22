import { act, renderHook } from '@testing-library/preact';

import type { AgentOption } from '../../../constants/agents';

import { useAgentSelection } from './useAgentSelection';

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAgentSelection', () => {
  const mockAgentOptions: AgentOption[] = [
    { id: 'accessibility', label: 'Accessibility', description: 'Test' },
    { id: 'designSystem', label: 'Design System', description: 'Test' },
    { id: 'usability', label: 'Usability', description: 'Test' },
  ];

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('デフォルトで選択されたエージェントで初期化される', () => {
    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    expect(result.current.selectedAgents).toEqual(['accessibility', 'designSystem', 'usability']);
  });

  it('localStorageから保存された選択を読み込む', () => {
    localStorageMock.setItem(
      'figma-ui-reviewer-selected-agents',
      JSON.stringify(['accessibility'])
    );

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    expect(result.current.selectedAgents).toEqual(['accessibility']);
  });

  it('localStorageのパースエラーを適切に処理する', () => {
    localStorageMock.setItem('figma-ui-reviewer-selected-agents', 'invalid json');

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    // Should fall back to default
    expect(result.current.selectedAgents).toEqual(['accessibility', 'designSystem', 'usability']);
  });

  describe('handleAgentChange', () => {
    it('checkedがtrueのときにエージェントを追加する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        // Remove one first
        result.current.handleAgentChange('accessibility', false);
      });

      expect(result.current.selectedAgents).not.toContain('accessibility');

      act(() => {
        // Add it back
        result.current.handleAgentChange('accessibility', true);
      });

      expect(result.current.selectedAgents).toContain('accessibility');
    });

    it('checkedがfalseのときにエージェントを削除する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleAgentChange('accessibility', false);
      });

      expect(result.current.selectedAgents).not.toContain('accessibility');
      expect(result.current.selectedAgents).toContain('designSystem');
      expect(result.current.selectedAgents).toContain('usability');
    });

    it('選択をlocalStorageに保存する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleAgentChange('designSystem', false);
      });

      const saved = localStorageMock.getItem('figma-ui-reviewer-selected-agents');
      expect(JSON.parse(saved!)).toEqual(['accessibility', 'usability']);
    });

    it('複数の変更を処理する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleAgentChange('accessibility', false);
      });

      act(() => {
        result.current.handleAgentChange('designSystem', false);
      });

      expect(result.current.selectedAgents).toEqual(['usability']);
    });
  });

  describe('handleSelectAll', () => {
    it('利用可能なすべてのエージェントを選択する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      // First deselect all
      act(() => {
        result.current.handleDeselectAll();
      });

      expect(result.current.selectedAgents).toEqual([]);

      // Then select all
      act(() => {
        result.current.handleSelectAll();
      });

      expect(result.current.selectedAgents).toEqual(['accessibility', 'designSystem', 'usability']);
    });

    it('選択されたすべてのエージェントをlocalStorageに保存する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleSelectAll();
      });

      const saved = localStorageMock.getItem('figma-ui-reviewer-selected-agents');
      expect(JSON.parse(saved!)).toEqual(['accessibility', 'designSystem', 'usability']);
    });
  });

  describe('handleDeselectAll', () => {
    it('すべてのエージェントの選択を解除する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleDeselectAll();
      });

      expect(result.current.selectedAgents).toEqual([]);
    });

    it('空の選択をlocalStorageに保存する', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleDeselectAll();
      });

      const saved = localStorageMock.getItem('figma-ui-reviewer-selected-agents');
      expect(JSON.parse(saved!)).toEqual([]);
    });
  });

  it('複数の操作を通じて選択状態を維持する', () => {
    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    act(() => {
      result.current.handleDeselectAll();
    });

    act(() => {
      result.current.handleAgentChange('accessibility', true);
    });

    act(() => {
      result.current.handleAgentChange('usability', true);
    });

    act(() => {
      result.current.handleAgentChange('accessibility', false);
    });

    expect(result.current.selectedAgents).toEqual(['usability']);
  });
});
