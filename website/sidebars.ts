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
      {
        type: 'doc',
        id: 'examples/fonts',
        label: 'Formatting keyboard',
        className: 'pro',
      },
      'examples/configureExtensions',
      'examples/colorKeyboard',
      'examples/navHeader',
      {
        type: 'doc',
        id: 'examples/mentions',
        label: 'Mentions',
        className: 'pro',
      },
      'examples/customKeyboard',
      'examples/darkTheme',
      'examples/customTheme',
      {
        type: 'doc',
        id: 'examples/realtimeCollab',
        label: 'Realtime Collaboration',
        className: 'pro',
      },
      {
        type: 'doc',
        id: 'examples/comments',
        label: 'Comments',
        className: 'pro',
      },
    ],
  },
};

export default sidebars;
