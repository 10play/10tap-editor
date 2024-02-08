import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: {
    Introduction: ['intro', 'mainConcepts'],
    Setup: ['setup/installation', 'setup/advancedSetup'],
    API: ['api/useEditorBridge', 'api/EditorBridge', 'api/RichText'],
    examples: ['examples/basic'],
  },
};

export default sidebars;
