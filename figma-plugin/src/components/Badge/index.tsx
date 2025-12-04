import { h } from 'preact';

interface BadgeProps {
  severity: 'high' | 'medium' | 'low';
  className?: string;
}

export default function Badge({ severity, className = '' }: BadgeProps) {
  const severityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${severityColors[severity]} ${className}`}
    >
      {severity.toUpperCase()}
    </span>
  );
}
