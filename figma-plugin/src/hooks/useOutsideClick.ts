import { useEffect } from 'preact/hooks';

export function useOutsideClick(
  isOpen: boolean,
  onClose: () => void,
  targetSelectors: string[]
): void {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      const isInsideTarget = targetSelectors.some((selector) => target.closest(selector));

      if (isOpen && !isInsideTarget) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose, targetSelectors]);
}
