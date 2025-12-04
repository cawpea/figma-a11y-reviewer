import { LoadingIndicator } from '@create-figma-plugin/ui';
import { h } from 'preact';

export default function LoadingView() {
  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-white/80 z-50 flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="text-center text-gray-800">
        <div className="mx-auto mb-3 flex justify-center">
          <LoadingIndicator />
        </div>
        <strong className="text-sm font-bold mt-2 text-gray-800">Reviewing...</strong>
        <p className="text-xs mt-2 text-gray-600">約30~60秒ほどお待ちください</p>
      </div>
    </div>
  );
}
