import { IconCheck16 } from '@create-figma-plugin/ui';
import { h } from 'preact';

interface PositiveItemProps {
  text: string;
}

export default function PositiveItem({ text }: PositiveItemProps) {
  return (
    <li className="text-green-700 text-[11px] relative pl-[1.1rem]">
      <IconCheck16 className="absolute left-0" aria-hidden="true" />
      <span className="inline-block">{text}</span>
    </li>
  );
}
