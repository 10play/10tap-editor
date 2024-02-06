import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: {
    Introduction: ['intro'],
    Setup: ['setup/installation'],
    API: ['api/useEditorBridge', 'api/EditorBridge'],
    examples: ['examples/basic'],
  },
};

export default sidebars;
