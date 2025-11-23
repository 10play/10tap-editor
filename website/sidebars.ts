import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      items: ['intro', 'mainConcepts'],
    },
    {
      type: 'category',
      label: 'Setup',
      items: ['setup/installation', 'setup/advancedSetup', 'setup/expoWeb'],
    },
    {
      type: 'category',
      label: 'API',
      items: [
        'api/useEditorBridge',
        'api/EditorBridge',
        'api/BridgeState',
        'api/Components',
        'api/BridgeExtensions',
        'api/useEditorContent',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: false, // Ensure the Examples category is open by default
      items: [
        'examples/basic',
        'examples/customCss',
        {
          type: 'doc',
          id: 'examples/fonts',
          label: 'Formatting keyboard',
          className: 'pro',
        },
        'examples/configureExtensions',
        'examples/navHeader',
        {
          type: 'doc',
          id: 'examples/mentions',
          label: 'Mentions',
          className: 'pro',
        },
        {
          type: 'doc',
          id: 'examples/search',
          label: 'Search',
          className: 'pro',
        },
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
    {
      type: 'category',
      label: 'Migration Guides',
      items: ['migrations/v1.0'],
    },
  ],
};
export default sidebars;
