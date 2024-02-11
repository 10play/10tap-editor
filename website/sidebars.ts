import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: {
    Introduction: ['intro', 'mainConcepts'],
    Setup: ['setup/installation', 'setup/advancedSetup'],
    API: [
      'api/useEditorBridge',
      'api/EditorBridge',
      'api/BridgeState',
      'api/RichText',
      'api/CustomKeyboardUtils',
      'api/BridgeExtensions',
    ],
    examples: [
      'examples/basic',
      'examples/customCss',
      'examples/configureExtensions',
      'examples/colorKeyboard',
    ],
  },
};

export default sidebars;
