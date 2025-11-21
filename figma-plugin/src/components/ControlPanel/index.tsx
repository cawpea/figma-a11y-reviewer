import { h } from 'preact';
import type { ComponentChildren } from 'preact';
import Button from '../Button';

interface ControlPanelProps {
  selectedAgentsCount: number;
  onEvaluate: () => void;
  onSettingsToggle: () => void;
  isSettingsOpen: boolean;
  children?: ComponentChildren;
}

export default function ControlPanel({
  selectedAgentsCount,
  onEvaluate,
  onSettingsToggle,
  isSettingsOpen,
  children
}: ControlPanelProps) {
  return (
    <div className="flex gap-2 mb-5 relative">
      <Button
        onClick={onEvaluate}
        disabled={selectedAgentsCount === 0}
        variant="primary"
      >
        評価を開始
      </Button>
      <Button
        onClick={onSettingsToggle}
        variant="icon"
        title="評価項目を選択"
        className="settings-btn"
      >
        ⚙️
      </Button>

      {children}
    </div>
  );
}
