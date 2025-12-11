import { h } from 'preact';

import { type WCAGLevel } from '../Plugin/hooks/useWCAGLevelSelection';

interface WCAGLevelSelectorProps {
  wcagLevel: WCAGLevel;
  onChange: (level: WCAGLevel) => void;
}

const wcagLevels: Array<{ value: WCAGLevel; label: string; description: string }> = [
  {
    value: 'A',
    label: 'WCAG 2.2 A基準',
    description: 'コントラスト比 3:1以上（大テキスト 1.5:1）',
  },
  {
    value: 'AA',
    label: 'WCAG 2.2 AA基準',
    description: 'コントラスト比 4.5:1以上（大テキスト 3:1）',
  },
  {
    value: 'AAA',
    label: 'WCAG 2.2 AAA基準',
    description: 'コントラスト比 7:1以上（大テキスト 4.5:1）',
  },
];

export default function WCAGLevelSelector({ wcagLevel, onChange }: WCAGLevelSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {wcagLevels.map((level) => (
        <label
          key={level.value}
          className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50"
        >
          <input
            type="radio"
            name="wcag-level"
            value={level.value}
            checked={wcagLevel === level.value}
            onChange={() => onChange(level.value)}
            className="mt-1 cursor-pointer"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-800">{level.label}</span>
            <span className="text-xs text-gray-500">{level.description}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
