import { IconCheck16 } from '@create-figma-plugin/ui';
import { h } from 'preact';

interface PositiveItemProps {
  text: string;
}

export default function PositiveItem({ text }: PositiveItemProps) {
  return (
    <li className="text-green-700 text-xs relative pl-[1.1rem]">
      <IconCheck16 className="absolute left-0 inline-block align-middle" />
      <p className="inline-block">{text}</p>
    </li>
  );
}
