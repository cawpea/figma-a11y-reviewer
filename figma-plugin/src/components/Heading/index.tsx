import type { ComponentChildren } from 'preact';
import { h } from 'preact';

interface HeadingProps {
  children: ComponentChildren;
  rightContent?: ComponentChildren;
  className?: string;
  id?: string;
}

export default function Heading({ children, rightContent, className = '', id }: HeadingProps) {
  if (rightContent) {
    return (
      <div className={`flex justify-between items-center w-full mb-3 ${className}`}>
        <h3 id={id} className="text-xs font-semibold text-gray-800">
          {children}
        </h3>
        {rightContent}
      </div>
    );
  }

  return <h3 className={`text-xs font-semibold text-gray-800 mb-3 ${className}`}>{children}</h3>;
}
