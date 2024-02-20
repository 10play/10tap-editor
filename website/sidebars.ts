import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: {
    Introduction: ['intro', 'mainConcepts'],
    Setup: ['setup/installation', 'setup/advancedSetup'],
    API: [
      'api/useEditorBridge',
      'api/EditorBridge',
      'api/BridgeState',
      'api/Components',
      'api/CustomKeyboardUtils',
      'api/BridgeExtensions',
      'api/useEditorContent',
    ],
    Examples: [
      'examples/basic',
      'examples/customCss',
      'examples/configureExtensions',
      'examples/colorKeyboard',
      'examples/navHeader',
      'examples/customKeyboard',
      'examples/darkTheme',
      'examples/customTheme',
    ],
  },
};

export default sidebars;
