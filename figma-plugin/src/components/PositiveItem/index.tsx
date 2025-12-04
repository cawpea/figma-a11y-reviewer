import { h } from 'preact';

interface PositiveItemProps {
  text: string;
}

export default function PositiveItem({ text }: PositiveItemProps) {
  return (
    <li className="text-green-700 text-[11px] pl-4 relative">
      <span className="absolute left-0 font-bold">✓</span>
      <p className="inline-block">{text}</p>
    </li>
  );
}
