import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

import Badge from './index';

describe('Badge', () => {
  it('renders high severity badge', () => {
    render(<Badge severity="high" />);

    const badge = screen.getByText('HIGH');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-600');
  });

  it('renders medium severity badge', () => {
    render(<Badge severity="medium" />);

    const badge = screen.getByText('MEDIUM');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-700');
  });

  it('renders low severity badge', () => {
    render(<Badge severity="low" />);

    const badge = screen.getByText('LOW');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-600');
  });

  it('applies custom className', () => {
    render(<Badge severity="high" className="custom-class" />);

    const badge = screen.getByText('HIGH');
    expect(badge).toHaveClass('custom-class');
  });

  it('displays severity text in uppercase', () => {
    render(<Badge severity="high" />);

    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.queryByText('high')).not.toBeInTheDocument();
  });

  it('has correct base classes', () => {
    render(<Badge severity="medium" />);

    const badge = screen.getByText('MEDIUM');
    expect(badge).toHaveClass('inline-block');
    expect(badge).toHaveClass('px-1.5');
    expect(badge).toHaveClass('py-0.5');
    expect(badge).toHaveClass('rounded');
    expect(badge).toHaveClass('font-semibold');
  });
});
