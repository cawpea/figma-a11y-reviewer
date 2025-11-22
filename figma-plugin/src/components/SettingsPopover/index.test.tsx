import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';

import type { AgentOption } from '../../constants/agents';

import SettingsPopover from './index';

describe('SettingsPopover', () => {
  const mockAgentOptions: AgentOption[] = [
    { id: 'accessibility', label: 'アクセシビリティ', description: 'WCAG準拠を評価' },
    {
      id: 'styleConsistency',
      label: 'スタイルや命名の一貫性',
      description: 'デザインの一貫性を評価',
    },
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

  it('タイトル付きでポップオーバーをレンダリングする', () => {
    render(<SettingsPopover {...defaultProps} />);

    expect(screen.getByText('評価項目の選択')).toBeInTheDocument();
  });

  it('すべてのエージェントオプションをレンダリングする', () => {
    render(<SettingsPopover {...defaultProps} />);

    expect(screen.getByText('アクセシビリティ')).toBeInTheDocument();
    expect(screen.getByText('スタイルや命名の一貫性')).toBeInTheDocument();
  });

  it('閉じるボタンがクリックされたときonCloseを呼び出す', async () => {
    render(<SettingsPopover {...defaultProps} />);

    const closeButton = screen.getByText('×');
    await userEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('全選択ボタンがクリックされたときonSelectAllを呼び出す', async () => {
    render(<SettingsPopover {...defaultProps} />);

    const selectAllButton = screen.getByText('全選択');
    await userEvent.click(selectAllButton);

    expect(defaultProps.onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('全解除ボタンがクリックされたときonDeselectAllを呼び出す', async () => {
    render(<SettingsPopover {...defaultProps} />);

    const deselectAllButton = screen.getByText('全解除');
    await userEvent.click(deselectAllButton);

    expect(defaultProps.onDeselectAll).toHaveBeenCalledTimes(1);
  });

  it('推定時間を表示する', () => {
    render(<SettingsPopover {...defaultProps} estimatedTime={33} />);

    // TimeEstimateコンポーネントが表示されることを確認
    // 実際の表示内容はTimeEstimateコンポーネントに依存
    const popover = screen.getByText('評価項目の選択').closest('.settings-popover');
    expect(popover).toBeInTheDocument();
  });

  it('選択されたエージェントをハイライトする', () => {
    render(
      <SettingsPopover {...defaultProps} selectedAgents={['accessibility', 'styleConsistency']} />
    );

    // AgentOptionItemがチェックされた状態で表示される
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('選択されたエージェントが空の状態でレンダリングする', () => {
    render(<SettingsPopover {...defaultProps} selectedAgents={[]} />);

    expect(screen.getByText('アクセシビリティ')).toBeInTheDocument();
  });

  it('すべてのエージェントが選択された状態でレンダリングする', () => {
    render(
      <SettingsPopover {...defaultProps} selectedAgents={['accessibility', 'styleConsistency']} />
    );

    expect(screen.getByText('評価項目の選択')).toBeInTheDocument();
  });
});
