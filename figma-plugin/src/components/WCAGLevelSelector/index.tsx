import { RadioButtons } from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useMemo } from 'preact/hooks';

import { type WCAGLevel } from '../Plugin/hooks/useWCAGLevelSelection';

interface WCAGLevelSelectorProps {
  wcagLevel: WCAGLevel;
  onChange: (level: WCAGLevel) => void;
}

const wcagLevels: Array<{ value: WCAGLevel; label: string; description: string }> = [
  {
    value: 'A',
    label: 'WCAG 2.2 Level A',
    description: '情報や機能に到達するための最低限の基準',
  },
  {
    value: 'AA',
    label: 'WCAG 2.2 Level AA',
    description: 'より多くの人が問題なく使えることを目的とした実用的な基準',
  },
  {
    value: 'AAA',
    label: 'WCAG 2.2 Level AAA',
    description: 'さまざまな障害のある人に対して最大限の配慮を行う最高レベルの基準',
  },
];

export default function WCAGLevelSelector({ wcagLevel, onChange }: WCAGLevelSelectorProps) {
  const options = useMemo(
    () =>
      wcagLevels.map((level, index) => ({
        value: level.value,
        children: (
          <div className={`${index < wcagLevels.length - 1 ? 'mb-2' : ''}`}>
            <div className="flex-1 relative top-[-4px]">
              <div className="font-medium text-xs mb-1.5">{level.label}</div>
              <div className="text-[10px] text-gray-500 leading-tight">{level.description}</div>
            </div>
          </div>
        ),
      })),
    []
  );

  return (
    <RadioButtons
      value={wcagLevel}
      onValueChange={(value) => onChange(value as WCAGLevel)}
      options={options}
      direction="vertical"
      space="extraSmall"
    />
  );
}
