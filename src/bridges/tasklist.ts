import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import BridgeExtension from './base';

type TaskListEditorState = {
  isTaskListActive: boolean;
  canToggleTaskList: boolean;
};

type TaskListEditorInstance = {
  toggleTaskList: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends TaskListEditorState {}
  interface EditorBridge extends TaskListEditorInstance {}
}

export enum TaskListEditorActionType {
  ToggleTaskList = 'toggle-task-list',
}

type TaskListMessage = {
  type: TaskListEditorActionType.ToggleTaskList;
  payload?: undefined;
};

export const TaskListBridge = new BridgeExtension<
  TaskListEditorState,
  TaskListEditorInstance,
  TaskListMessage
>({
  tiptapExtension: TaskList,
  tiptapExtensionDeps: [TaskItem],
  onBridgeMessage: (editor, message) => {
    if (message.type === TaskListEditorActionType.ToggleTaskList) {
      editor.chain().focus().toggleTaskList().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleTaskList: () =>
        sendBridgeMessage({ type: TaskListEditorActionType.ToggleTaskList }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleTaskList: editor.can().toggleTaskList(),
      isTaskListActive: editor.isActive('taskList'),
    };
  },
  extendCSS: `
  ul[data-type="taskList"] {
    list-style: none;
    padding: 0;
  }
  
  ul[data-type="taskList"] > li {
    display: flex;
  }
  
  ul[data-type="taskList"] p {
    margin: 0;
  }
  
  ul[data-type="taskList"] li {
    display: flex;
  }
  
  ul[data-type="taskList"] li > label > input {
    font-size: inherit;
    font-family: inherit;
    color: #000;
    margin: 0.1rem;
    border: 1px solid black;
    border-radius: 0.3rem;
    padding: 0.1rem 0.4rem;
    background: white;
    accent-color: black;
  }
  ul[data-type="taskList"] li > label {
    flex: 0 0 auto;
    margin-right: 0.5rem;
    user-select: none;
  }
  
  ul[data-type="taskList"] li > div {
    flex: 1 1 auto;
  }
  
  ul[data-type="taskList"] li ul li,
  ul[data-type="taskList"] li ol li {
    display: list-item;
  }
  `,
});
