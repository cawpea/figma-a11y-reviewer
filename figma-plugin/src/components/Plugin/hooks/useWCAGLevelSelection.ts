import { emit, on } from '@create-figma-plugin/utilities';
import { useCallback, useEffect, useState } from 'preact/hooks';

export type WCAGLevel = 'A' | 'AA' | 'AAA';

interface UseWCAGLevelSelectionReturn {
  wcagLevel: WCAGLevel;
  handleWCAGLevelChange: (level: WCAGLevel) => void;
}

export function useWCAGLevelSelection(): UseWCAGLevelSelectionReturn {
  // デフォルトはAA基準（現在の基準）
  const [wcagLevel, setWCAGLevel] = useState<WCAGLevel>('AA');

  // 初期化: 保存されたWCAG基準を復元
  useEffect(() => {
    const handleWCAGLevelLoaded = ({ wcagLevel: savedLevel }: { wcagLevel: WCAGLevel | null }) => {
      if (savedLevel !== null) {
        setWCAGLevel(savedLevel);
      }
      // null の場合はデフォルト値('AA')を使用
    };

    on('WCAG_LEVEL_LOADED', handleWCAGLevelLoaded);
    emit('LOAD_WCAG_LEVEL');

    return () => {
      // クリーンアップ（ハンドラーの登録解除）
      // Note: @create-figma-plugin/utilities の on() は登録解除の仕組みを提供していないため、
      // 複数回マウントされる場合に重複して実行される可能性がある
    };
  }, []);

  // WCAG基準変更ハンドラー
  const handleWCAGLevelChange = useCallback((level: WCAGLevel) => {
    setWCAGLevel(level);
    emit('SAVE_WCAG_LEVEL', level);
  }, []);

  return {
    wcagLevel,
    handleWCAGLevelChange,
  };
}
