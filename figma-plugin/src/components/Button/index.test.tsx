import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';

import Button from './index';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button onClick={() => {}}>Click me</Button>);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Button onClick={() => {}} disabled>
        Click me
      </Button>
    );

    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    await userEvent.click(screen.getByText('Click me'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant classes by default', () => {
    render(<Button onClick={() => {}}>Primary</Button>);

    const button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-blue-500');
  });

  it('applies secondary variant classes', () => {
    render(
      <Button onClick={() => {}} variant="secondary">
        Secondary
      </Button>
    );

    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-gray-100');
  });

  it('applies icon variant classes', () => {
    render(
      <Button onClick={() => {}} variant="icon">
        Icon
      </Button>
    );

    const button = screen.getByText('Icon');
    expect(button).toHaveClass('w-10');
  });

  it('applies custom className', () => {
    render(
      <Button onClick={() => {}} className="custom-class">
        Custom
      </Button>
    );

    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });

  it('applies title attribute', () => {
    render(
      <Button onClick={() => {}} title="Button title">
        Button
      </Button>
    );

    const button = screen.getByText('Button');
    expect(button).toHaveAttribute('title', 'Button title');
  });

  it('renders complex children', () => {
    render(
      <Button onClick={() => {}}>
        <span>Icon</span> Text
      </Button>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText(/Text/)).toBeInTheDocument();
  });
});
