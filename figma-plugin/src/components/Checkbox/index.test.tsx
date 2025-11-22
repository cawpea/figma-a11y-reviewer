import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';

import Checkbox from './index';

describe('Checkbox', () => {
  it('renders checkbox with given id', () => {
    render(<Checkbox id="test-checkbox" checked={false} onChange={() => {}} />);

    const input = screen.getByRole('checkbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test-checkbox');
  });

  it('is checked when checked prop is true', () => {
    render(<Checkbox id="test" checked={true} onChange={() => {}} />);

    const input = screen.getByRole('checkbox');
    expect(input).toBeChecked();
  });

  it('is unchecked when checked prop is false', () => {
    render(<Checkbox id="test" checked={false} onChange={() => {}} />);

    const input = screen.getByRole('checkbox');
    expect(input).not.toBeChecked();
  });

  it('calls onChange with true when clicked while unchecked', async () => {
    const handleChange = jest.fn();
    render(<Checkbox id="test" checked={false} onChange={handleChange} />);

    const input = screen.getByRole('checkbox');
    await userEvent.click(input);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when clicked while checked', async () => {
    const handleChange = jest.fn();
    render(<Checkbox id="test" checked={true} onChange={handleChange} />);

    const input = screen.getByRole('checkbox');
    await userEvent.click(input);

    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('displays checkmark icon when checked', () => {
    const { container } = render(<Checkbox id="test" checked={true} onChange={() => {}} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not display checkmark icon when unchecked', () => {
    const { container } = render(<Checkbox id="test" checked={false} onChange={() => {}} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('applies custom className to label', () => {
    const { container } = render(
      <Checkbox id="test" checked={false} onChange={() => {}} className="custom-class" />
    );

    const label = container.querySelector('label');
    expect(label).toHaveClass('custom-class');
  });

  it('has proper styling classes', () => {
    const { container } = render(<Checkbox id="test" checked={false} onChange={() => {}} />);

    const label = container.querySelector('label');
    expect(label).toHaveClass('w-4');
    expect(label).toHaveClass('h-4');
    expect(label).toHaveClass('cursor-pointer');
  });

  it('changes style when checked', () => {
    const { container, rerender } = render(
      <Checkbox id="test" checked={false} onChange={() => {}} />
    );

    let label = container.querySelector('label');
    expect(label).toHaveClass('bg-white');

    rerender(<Checkbox id="test" checked={true} onChange={() => {}} />);

    label = container.querySelector('label');
    expect(label).toHaveClass('bg-blue-500');
    expect(label).toHaveClass('border-blue-500');
  });
});
