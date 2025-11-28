/**
 * デバウンスされた関数の型定義
 */
export interface DebouncedFunction<T extends (...args: never[]) => void> {
  (...args: Parameters<T>): void;
  cancel(): void;
}

/**
 * 指定されたミリ秒だけ関数の実行を遅延させるデバウンス関数
 *
 * @param func - デバウンスする関数
 * @param delay - 遅延時間(ミリ秒)
 * @returns デバウンスされた関数とcancel()メソッド
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  } as DebouncedFunction<T>;

  debounced.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
