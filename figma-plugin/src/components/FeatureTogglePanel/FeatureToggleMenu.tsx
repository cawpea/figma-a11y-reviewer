import { Checkbox } from '@create-figma-plugin/ui';
import type { RefObject } from 'preact';
import { h } from 'preact';

import { featureFlagConfigs } from '../../constants/featureFlags';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext/useFeatureFlags';

interface FeatureToggleMenuProps {
  onClose: () => void;
  menuRef: RefObject<HTMLDivElement>;
}

export function FeatureToggleMenu({ onClose, menuRef }: FeatureToggleMenuProps) {
  const { flags, toggleFlag } = useFeatureFlags();

  return (
    <div
      ref={menuRef}
      className="
        fixed bottom-20 right-4
        w-80
        bg-white
        border border-gray-300
        rounded-lg
        shadow-xl
        z-50
        animate-slide-up
      "
      role="dialog"
      aria-label="機能トグル設定"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800">機能トグル設定</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="閉じる"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Feature flag list */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {featureFlagConfigs.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            現在、設定可能な機能フラグはありません
          </p>
        ) : (
          featureFlagConfigs.map((config) => (
            <div key={config.key} className="mb-3 p-3 border border-gray-200 rounded-md">
              <Checkbox
                value={flags[config.key] ?? config.defaultEnabled}
                onValueChange={() => toggleFlag(config.key)}
              >
                <div className="flex-1 relative top-[-3px]">
                  <div className="font-medium text-xs mb-1.5">{config.label}</div>
                  <div className="text-[10px] text-gray-500 leading-tight">
                    {config.description}
                  </div>
                </div>
              </Checkbox>
            </div>
          ))
        )}
      </div>

      {/* Footer note */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <p className="text-[10px] text-gray-500">Development環境でのみ表示されます</p>
      </div>
    </div>
  );
}
