import { TaskList, TaskItem } from '@tiptap/extension-list';
import BridgeExtension from './base';

type TaskListEditorState = {
  isTaskListActive: boolean;
  canToggleTaskList: boolean;
  canLiftTaskListItem: boolean;
  canSinkTaskListItem: boolean;
};

type TaskListEditorInstance = {
  toggleTaskList: () => void;
  liftTaskListItem: () => void;
  sinkTaskListItem: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends TaskListEditorState {}
  interface EditorBridge extends TaskListEditorInstance {}
}

export enum TaskListEditorActionType {
  ToggleTaskList = 'toggle-task-list',
  LiftTaskListItem = 'lift-task-list-item',
  SinkTaskListItem = 'sink-task-list-item',
}

type TaskListMessage =
  | {
      type: TaskListEditorActionType.ToggleTaskList;
      payload?: undefined;
    }
  | {
      type: TaskListEditorActionType.LiftTaskListItem;
      payload?: undefined;
    }
  | {
      type: TaskListEditorActionType.SinkTaskListItem;
      payload?: undefined;
    };

export const TaskListBridge = new BridgeExtension<
  TaskListEditorState,
  TaskListEditorInstance,
  TaskListMessage
>({
  tiptapExtension: TaskList,
  tiptapExtensionDeps: [TaskItem.configure({ nested: true })],
  onBridgeMessage: (editor, message) => {
    if (message.type === TaskListEditorActionType.ToggleTaskList) {
      editor.chain().focus().toggleTaskList().run();
    }
    if (message.type === TaskListEditorActionType.LiftTaskListItem) {
      editor
        .chain()
        .focus()
        .liftListItem(editor.state.schema.nodes.taskItem!.name)
        .run();
    }
    if (message.type === TaskListEditorActionType.SinkTaskListItem) {
      editor
        .chain()
        .focus()
        .sinkListItem(editor.state.schema.nodes.taskItem!.name)
        .run();
    }
    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleTaskList: () =>
        sendBridgeMessage({ type: TaskListEditorActionType.ToggleTaskList }),
      liftTaskListItem: () =>
        sendBridgeMessage({ type: TaskListEditorActionType.LiftTaskListItem }),
      sinkTaskListItem: () =>
        sendBridgeMessage({ type: TaskListEditorActionType.SinkTaskListItem }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleTaskList: editor.can().toggleTaskList(),
      isTaskListActive: editor.isActive('taskList'),
      canLiftTaskListItem: editor
        .can()
        .liftListItem(editor.state.schema.nodes.taskItem!.name),
      canSinkTaskListItem: editor
        .can()
        .sinkListItem(editor.state.schema.nodes.taskItem!.name),
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
  `,
});
