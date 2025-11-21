import { h } from 'preact';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export default function Checkbox({ id, checked, onChange, className = '' }: CheckboxProps) {
  return (
    <div className="relative inline-block">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        className="sr-only"
      />
      <label
        htmlFor={id}
        className={`
          w-4 h-4 mt-0.5 cursor-pointer inline-block relative
          border-2 border-gray-300 rounded 
          transition-all duration-200 ease-in-out
          ${checked ? 'bg-blue-500 border-blue-500' : 'bg-white hover:border-blue-400'}
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20
          ${className}
        `}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white absolute top-0 left-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </label>
    </div>
  );
}
