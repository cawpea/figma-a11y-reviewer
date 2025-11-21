import { h } from 'preact';

interface PositiveItemProps {
  text: string;
}

export default function PositiveItem({ text }: PositiveItemProps) {
  return (
    <div className="text-green-600 text-[11px] mb-1 pl-4 relative">
      <span className="absolute left-0 font-bold">✓</span>
      {text}
    </div>
  );
}
