import { IconCheck16 } from '@create-figma-plugin/ui';
import { h } from 'preact';

interface PositiveItemProps {
  text: string;
}

export default function PositiveItem({ text }: PositiveItemProps) {
  return (
    <li className="text-green-700 text-[11px] relative">
      <IconCheck16 className="inline-block align-middle mr-1" />
      <p className="inline-block">{text}</p>
    </li>
  );
}
