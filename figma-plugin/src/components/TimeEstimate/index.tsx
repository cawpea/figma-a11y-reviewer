import { h } from 'preact';

interface TimeEstimateProps {
  selectedCount: number;
  secondsPerAgent: number;
}

export default function TimeEstimate({ selectedCount, secondsPerAgent }: TimeEstimateProps) {
  const estimatedTime = selectedCount * secondsPerAgent;

  return (
    <div className="mt-3 p-2 bg-blue-50 rounded text-[10px] text-blue-800 text-center">
      {selectedCount}項目選択中 • 約{estimatedTime}秒
    </div>
  );
}
