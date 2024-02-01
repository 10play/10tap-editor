import type { ToolbarContext } from '../Toolbar';

export interface CustomKeyboardProps {
  rootRef: React.RefObject<any>;
  color: boolean;
  setToolbarContext: (context: ToolbarContext) => void;
}
