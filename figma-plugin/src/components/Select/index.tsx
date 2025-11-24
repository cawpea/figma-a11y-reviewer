import { h } from 'preact';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export default function Select({ id, value, options, onChange, className = '' }: SelectProps) {
  return (
    <div className="relative inline-block w-full">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className={`
          w-full px-3 py-1.5 text-xs
          bg-white border border-gray-300 rounded
          cursor-pointer appearance-none
          hover:border-blue-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500
          transition-all duration-200
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* カスタムドロップダウンアイコン */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
