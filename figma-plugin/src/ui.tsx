import { render } from '@create-figma-plugin/ui';
import { h } from 'preact';

import Plugin from './components/Plugin';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

function App() {
  return (
    <FeatureFlagProvider>
      <Plugin />
    </FeatureFlagProvider>
  );
}

export default render(App);
