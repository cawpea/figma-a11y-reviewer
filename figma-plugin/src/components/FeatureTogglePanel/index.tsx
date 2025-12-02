import { Fragment, h } from 'preact';
import { useState } from 'preact/hooks';

import { useClickOutside } from '../../hooks/useClickOutside';

import { FeatureToggleButton } from './FeatureToggleButton';
import { FeatureToggleMenu } from './FeatureToggleMenu';

export default function FeatureTogglePanel() {
  // 開発環境チェック
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Fragment>
      <FeatureToggleButton onClick={handleToggle} isOpen={isOpen} />
      {isOpen && <FeatureToggleMenu onClose={handleClose} menuRef={menuRef} />}
    </Fragment>
  );
}
