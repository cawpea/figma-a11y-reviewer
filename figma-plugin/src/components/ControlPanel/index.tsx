import { Button } from '@create-figma-plugin/ui';
import { h } from 'preact';

interface ControlPanelProps {
  selectedAgentsCount: number;
  onEvaluate: () => void;
}

export default function ControlPanel({ selectedAgentsCount, onEvaluate }: ControlPanelProps) {
  return (
    <div className="mb-5">
      <Button onClick={onEvaluate} disabled={selectedAgentsCount === 0} fullWidth>
        評価を開始
      </Button>
    </div>
  );
}
