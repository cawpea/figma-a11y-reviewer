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

  it('initializes with default selected agents', () => {
    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    expect(result.current.selectedAgents).toEqual(['accessibility', 'designSystem', 'usability']);
  });

  it('loads saved selection from localStorage', () => {
    localStorageMock.setItem(
      'figma-ui-reviewer-selected-agents',
      JSON.stringify(['accessibility'])
    );

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    expect(result.current.selectedAgents).toEqual(['accessibility']);
  });

  it('handles localStorage parse error gracefully', () => {
    localStorageMock.setItem('figma-ui-reviewer-selected-agents', 'invalid json');

    const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

    // Should fall back to default
    expect(result.current.selectedAgents).toEqual(['accessibility', 'designSystem', 'usability']);
  });

  describe('handleAgentChange', () => {
    it('adds agent when checked is true', () => {
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

    it('removes agent when checked is false', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleAgentChange('accessibility', false);
      });

      expect(result.current.selectedAgents).not.toContain('accessibility');
      expect(result.current.selectedAgents).toContain('designSystem');
      expect(result.current.selectedAgents).toContain('usability');
    });

    it('saves selection to localStorage', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleAgentChange('designSystem', false);
      });

      const saved = localStorageMock.getItem('figma-ui-reviewer-selected-agents');
      expect(JSON.parse(saved!)).toEqual(['accessibility', 'usability']);
    });

    it('handles multiple changes', () => {
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
    it('selects all available agents', () => {
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

    it('saves all selected agents to localStorage', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleSelectAll();
      });

      const saved = localStorageMock.getItem('figma-ui-reviewer-selected-agents');
      expect(JSON.parse(saved!)).toEqual(['accessibility', 'designSystem', 'usability']);
    });
  });

  describe('handleDeselectAll', () => {
    it('deselects all agents', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleDeselectAll();
      });

      expect(result.current.selectedAgents).toEqual([]);
    });

    it('saves empty selection to localStorage', () => {
      const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

      act(() => {
        result.current.handleDeselectAll();
      });

      const saved = localStorageMock.getItem('figma-ui-reviewer-selected-agents');
      expect(JSON.parse(saved!)).toEqual([]);
    });
  });

  it('maintains selection state across multiple operations', () => {
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
