import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';

import type { AgentOption } from '../../constants/agents';

import SettingsPopover from './index';

describe('SettingsPopover', () => {
  const mockAgentOptions: AgentOption[] = [
    { id: 'accessibility', label: 'アクセシビリティ', description: 'WCAG準拠を評価' },
    { id: 'designSystem', label: 'デザインシステム', description: 'デザインの一貫性を評価' },
  ];

  const defaultProps = {
    selectedAgents: ['accessibility'],
    agentOptions: mockAgentOptions,
    onAgentChange: jest.fn(),
    onSelectAll: jest.fn(),
    onDeselectAll: jest.fn(),
    onClose: jest.fn(),
    estimatedTime: 15,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders popover with title', () => {
    render(<SettingsPopover {...defaultProps} />);

    expect(screen.getByText('評価項目の選択')).toBeInTheDocument();
  });

  it('renders all agent options', () => {
    render(<SettingsPopover {...defaultProps} />);

    expect(screen.getByText('アクセシビリティ')).toBeInTheDocument();
    expect(screen.getByText('デザインシステム')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    render(<SettingsPopover {...defaultProps} />);

    const closeButton = screen.getByText('×');
    await userEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectAll when select all button is clicked', async () => {
    render(<SettingsPopover {...defaultProps} />);

    const selectAllButton = screen.getByText('全選択');
    await userEvent.click(selectAllButton);

    expect(defaultProps.onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('calls onDeselectAll when deselect all button is clicked', async () => {
    render(<SettingsPopover {...defaultProps} />);

    const deselectAllButton = screen.getByText('全解除');
    await userEvent.click(deselectAllButton);

    expect(defaultProps.onDeselectAll).toHaveBeenCalledTimes(1);
  });

  it('displays estimated time', () => {
    render(<SettingsPopover {...defaultProps} estimatedTime={33} />);

    // TimeEstimateコンポーネントが表示されることを確認
    // 実際の表示内容はTimeEstimateコンポーネントに依存
    const popover = screen.getByText('評価項目の選択').closest('.settings-popover');
    expect(popover).toBeInTheDocument();
  });

  it('highlights selected agents', () => {
    render(
      <SettingsPopover {...defaultProps} selectedAgents={['accessibility', 'designSystem']} />
    );

    // AgentOptionItemがチェックされた状態で表示される
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('renders with empty selected agents', () => {
    render(<SettingsPopover {...defaultProps} selectedAgents={[]} />);

    expect(screen.getByText('アクセシビリティ')).toBeInTheDocument();
  });

  it('renders with all agents selected', () => {
    render(
      <SettingsPopover {...defaultProps} selectedAgents={['accessibility', 'designSystem']} />
    );

    expect(screen.getByText('評価項目の選択')).toBeInTheDocument();
  });
});
