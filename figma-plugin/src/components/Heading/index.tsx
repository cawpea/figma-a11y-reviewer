import type { ComponentChildren } from 'preact';
import { h } from 'preact';

interface HeadingProps {
  children: ComponentChildren;
  rightContent?: ComponentChildren;
  className?: string;
}

export default function Heading({ children, rightContent, className = '' }: HeadingProps) {
  if (rightContent) {
    return (
      <div className={`flex justify-between items-center mb-3 ${className}`}>
        <h3 className="text-xs font-semibold text-gray-800">{children}</h3>
        {rightContent}
      </div>
    );
  }

  return <h3 className={`text-xs font-semibold text-gray-800 mb-3 ${className}`}>{children}</h3>;
}
