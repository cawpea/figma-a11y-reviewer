import { h } from 'preact';

interface FeatureToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FeatureToggleButton({ onClick, isOpen }: FeatureToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-4 right-4
        w-12 h-12
        rounded-full
        bg-blue-500 hover:bg-blue-600
        text-white
        shadow-lg hover:shadow-xl
        transition-all duration-200
        flex items-center justify-center
        z-40
        ${isOpen ? 'bg-blue-600' : ''}
      `}
      aria-label="機能トグル設定を開く"
      aria-expanded={isOpen}
      title="機能トグル設定"
      type="button"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    </button>
  );
}
