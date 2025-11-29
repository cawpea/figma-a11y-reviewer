import { h } from 'preact';

import Button from '../Button';

interface ControlPanelProps {
  selectedAgentsCount: number;
  onEvaluate: () => void;
}

export default function ControlPanel({ selectedAgentsCount, onEvaluate }: ControlPanelProps) {
  return (
    <div className="mb-5">
      <Button onClick={onEvaluate} disabled={selectedAgentsCount === 0} variant="primary">
        評価を開始
      </Button>
    </div>
  );
}
