import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

import Badge from './index';

describe('Badge', () => {
  it('高重要度バッジをレンダリングする', () => {
    render(<Badge severity="high" />);

    const badge = screen.getByText('HIGH');
    expect(badge).toBeInTheDocument();
  });

  it('中重要度バッジをレンダリングする', () => {
    render(<Badge severity="medium" />);

    const badge = screen.getByText('MEDIUM');
    expect(badge).toBeInTheDocument();
  });

  it('低重要度バッジをレンダリングする', () => {
    render(<Badge severity="low" />);

    const badge = screen.getByText('LOW');
    expect(badge).toBeInTheDocument();
  });

  it('カスタムclassNameを適用する', () => {
    render(<Badge severity="high" className="custom-class" />);

    const badge = screen.getByText('HIGH');
    expect(badge).toHaveClass('custom-class');
  });

  it('重要度テキストを大文字で表示する', () => {
    render(<Badge severity="high" />);

    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.queryByText('high')).not.toBeInTheDocument();
  });

  it('neutral severityバッジをレンダリングする', () => {
    render(<Badge severity="neutral" />);
    const badge = screen.getByText('NEUTRAL');
    expect(badge).toBeInTheDocument();
  });

  it('カスタムlabelを表示する', () => {
    render(<Badge severity="neutral" label="3個の要素" />);
    const badge = screen.getByText('3個の要素');
    expect(badge).toBeInTheDocument();
    expect(screen.queryByText('NEUTRAL')).not.toBeInTheDocument();
  });
});
