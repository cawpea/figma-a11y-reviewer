import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';

import type { Issue } from '../../../../shared/src/types';

import IssueItem from './index';

describe('IssueItem', () => {
  const mockIssue: Issue = {
    severity: 'high',
    message: 'テストメッセージ',
    nodeId: 'test-node-id',
    autoFixable: false,
  };

  const mockOnIssueClick = jest.fn();

  beforeEach(() => {
    mockOnIssueClick.mockClear();
  });

  describe('レンダリング', () => {
    it('Issue messageを正しく表示する', () => {
      render(<IssueItem issue={mockIssue} onIssueClick={mockOnIssueClick} />);

      expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
    });

    it('Badgeが正しいseverityで表示される', () => {
      render(<IssueItem issue={mockIssue} onIssueClick={mockOnIssueClick} />);

      const badge = screen.getByText('HIGH');
      expect(badge).toBeInTheDocument();
    });

    it('suggestionがある場合に表示される', () => {
      const issueWithSuggestion: Issue = {
        ...mockIssue,
        suggestion: 'テスト提案',
      };

      render(<IssueItem issue={issueWithSuggestion} onIssueClick={mockOnIssueClick} />);

      expect(screen.getByText(/テスト提案/)).toBeInTheDocument();
    });

    it('「選択」ボタンが表示される', () => {
      render(<IssueItem issue={mockIssue} onIssueClick={mockOnIssueClick} />);

      expect(screen.getByRole('button', { name: /選択/ })).toBeInTheDocument();
    });
  });

  describe('クリック動作', () => {
    it('選択ボタンをクリックするとonIssueClickが正しい引数で呼ばれる', async () => {
      render(<IssueItem issue={mockIssue} rootNodeId="root-id" onIssueClick={mockOnIssueClick} />);

      await userEvent.click(screen.getByRole('button', { name: /選択/ }));

      expect(mockOnIssueClick).toHaveBeenCalledTimes(1);
      expect(mockOnIssueClick).toHaveBeenCalledWith(mockIssue, 'root-id');
    });

    it('issue.nodeIdがある場合、ボタンが有効化される', () => {
      render(<IssueItem issue={mockIssue} onIssueClick={mockOnIssueClick} />);

      const button = screen.getByRole('button', { name: /選択/ });
      expect(button).not.toBeDisabled();
    });

    it('rootNodeIdがある場合、ボタンが有効化される', () => {
      const issueWithoutNodeId: Issue = {
        ...mockIssue,
        nodeId: undefined,
      };

      render(
        <IssueItem
          issue={issueWithoutNodeId}
          rootNodeId="root-id"
          onIssueClick={mockOnIssueClick}
        />
      );

      const button = screen.getByRole('button', { name: /選択/ });
      expect(button).not.toBeDisabled();
    });

    it('nodeIdとrootNodeIdが両方ない場合、ボタンが無効化される', () => {
      const issueWithoutNodeId: Issue = {
        ...mockIssue,
        nodeId: undefined,
      };

      render(<IssueItem issue={issueWithoutNodeId} onIssueClick={mockOnIssueClick} />);

      const button = screen.getByRole('button', { name: /選択/ });
      expect(button).toBeDisabled();
    });
  });

  describe('無効状態', () => {
    it('無効時、ボタンにdisabled属性が設定される', () => {
      const issueWithoutNodeId: Issue = {
        ...mockIssue,
        nodeId: undefined,
      };

      render(<IssueItem issue={issueWithoutNodeId} onIssueClick={mockOnIssueClick} />);

      const button = screen.getByRole('button', { name: /選択/ });
      expect(button).toHaveAttribute('disabled');
    });

    it('無効時のクリックではonIssueClickが呼ばれない', async () => {
      const issueWithoutNodeId: Issue = {
        ...mockIssue,
        nodeId: undefined,
      };

      render(<IssueItem issue={issueWithoutNodeId} onIssueClick={mockOnIssueClick} />);

      const button = screen.getByRole('button', { name: /選択/ });
      await userEvent.click(button);

      expect(mockOnIssueClick).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('getByRoleでボタンが取得できる', () => {
      render(<IssueItem issue={mockIssue} onIssueClick={mockOnIssueClick} />);

      const button = screen.getByRole('button', { name: /選択/ });
      expect(button).toBeInTheDocument();
    });

    it('選択ボタンは1つのみ存在する', () => {
      render(<IssueItem issue={mockIssue} onIssueClick={mockOnIssueClick} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });
  });
});
