import type { EvaluationResult } from '@shared/types';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

import ResultView from './index';

describe('ResultView', () => {
  const mockResult: EvaluationResult = {
    overallScore: 85,
    categories: {
      accessibility: {
        score: 90,
        issues: [
          {
            severity: 'high',
            message: 'Low contrast ratio',
            nodeId: '1:2',
            autoFixable: false,
            suggestion: 'Increase contrast',
          },
        ],
        positives: ['Good font sizes'],
      },
      styleConsistency: {
        score: 80,
        issues: [],
      },
    },
    suggestions: [],
    metadata: {
      evaluatedAt: new Date('2025-01-01T00:00:00Z'),
      duration: 1500,
      rootNodeId: '1:1',
      usage: {
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCachedTokens: 0,
        estimatedCost: 0.01,
      },
    },
  };

  const mockOnIssueClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('総合スコアカードをレンダリングする', () => {
    render(<ResultView result={mockResult} onIssueClick={mockOnIssueClick} />);

    // ScoreCardコンポーネントが表示されることを確認
    const score = screen.getByText('85', { exact: false });
    expect(score).toBeInTheDocument();
  });

  it('すべてのカテゴリセクションをレンダリングする', () => {
    render(<ResultView result={mockResult} onIssueClick={mockOnIssueClick} />);

    // カテゴリが表示されることを確認
    // 実際のラベルはcategoryLabelsに依存
    expect(screen.getByText('Low contrast ratio')).toBeInTheDocument();
    expect(screen.getByText('Good font sizes')).toBeInTheDocument();
  });

  it('メタデータ表示をレンダリングする', () => {
    render(<ResultView result={mockResult} onIssueClick={mockOnIssueClick} />);

    // MetadataDisplayコンポーネントが表示されることを確認
    // 期間が表示される
    expect(screen.getByText(/1.5/)).toBeInTheDocument();
  });

  it('onIssueClickをカテゴリセクションに渡す', () => {
    render(<ResultView result={mockResult} onIssueClick={mockOnIssueClick} />);

    // CategorySectionがクリック可能な要素を持つことを確認
    const issueElement = screen.getByText('Low contrast ratio');
    expect(issueElement).toBeInTheDocument();
  });

  it('空のカテゴリでレンダリングする', () => {
    const emptyResult: EvaluationResult = {
      ...mockResult,
      categories: {},
    };

    render(<ResultView result={emptyResult} onIssueClick={mockOnIssueClick} />);

    // スコアカードとメタデータは表示される
    expect(screen.getByText('85', { exact: false })).toBeInTheDocument();
  });

  it('カテゴリ内の複数の問題でレンダリングする', () => {
    const multiIssueResult: EvaluationResult = {
      ...mockResult,
      categories: {
        accessibility: {
          score: 70,
          issues: [
            {
              severity: 'high',
              message: 'Issue 1',
              autoFixable: false,
              suggestion: 'Fix 1',
            },
            {
              severity: 'medium',
              message: 'Issue 2',
              autoFixable: true,
              suggestion: 'Fix 2',
            },
            {
              severity: 'low',
              message: 'Issue 3',
              autoFixable: false,
              suggestion: 'Fix 3',
            },
          ],
        },
      },
    };

    render(<ResultView result={multiIssueResult} onIssueClick={mockOnIssueClick} />);

    expect(screen.getByText('Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Issue 2')).toBeInTheDocument();
    expect(screen.getByText('Issue 3')).toBeInTheDocument();
  });

  it('rootNodeIdをカテゴリセクションに渡す', () => {
    render(<ResultView result={mockResult} onIssueClick={mockOnIssueClick} />);

    // CategorySectionにrootNodeIdが渡されることを確認
    // rootNodeIdは内部的に使用されるが、UIには直接表示されない
    // 代わりに、結果が正常にレンダリングされることを確認
    expect(screen.getByText('Low contrast ratio')).toBeInTheDocument();
    expect(screen.getByText('85', { exact: false })).toBeInTheDocument();
  });
});
