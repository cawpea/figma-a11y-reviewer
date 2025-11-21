import { h } from 'preact';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export default function Checkbox({ id, checked, onChange, className = '' }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      className={`mt-0.5 cursor-pointer ${className}`}
    />
  );
}
