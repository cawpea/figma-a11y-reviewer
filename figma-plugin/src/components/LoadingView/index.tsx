import { h } from 'preact';

import Spinner from '../Spinner';

interface LoadingViewProps {
  selectedAgentsCount: number;
  estimatedTime: number;
}

export default function LoadingView({ selectedAgentsCount, estimatedTime }: LoadingViewProps) {
  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-white/80 z-50 flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="text-center text-gray-600">
        <Spinner className="mx-auto mb-3" />
        <div>AI評価中...</div>
        <div className="text-[10px] mt-2 text-gray-600">
          {selectedAgentsCount}項目を評価中 • 約{estimatedTime}秒ほどお待ちください
        </div>
      </div>
    </div>
  );
}
