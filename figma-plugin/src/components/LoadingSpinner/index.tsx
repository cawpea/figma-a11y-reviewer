import { h } from 'preact';
import Spinner from '../Spinner';

interface LoadingSpinnerProps {
  selectedAgentsCount: number;
  estimatedTime: number;
}

export default function LoadingSpinner({ selectedAgentsCount, estimatedTime }: LoadingSpinnerProps) {
  return (
    <div className="text-center py-5 text-gray-600">
      <Spinner className="mx-auto mb-3" />
      <div>AI評価中...</div>
      <div className="text-[10px] mt-2 text-gray-400">
        {selectedAgentsCount}項目を評価中 • 約{estimatedTime}秒ほどお待ちください
      </div>
    </div>
  );
}
