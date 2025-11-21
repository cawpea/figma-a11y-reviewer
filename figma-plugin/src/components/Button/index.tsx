import { h } from 'preact';
import type { ComponentChildren } from 'preact';

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
  title?: string;
  children: ComponentChildren;
}

export default function Button({
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  title,
  children,
}: ButtonProps) {
  const variantClasses = {
    primary:
      'flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white border-none rounded-md text-xs font-medium transition-colors duration-200',
    secondary:
      'flex-1 px-3 py-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border-none',
    icon: 'w-10 px-2.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center justify-center',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}
