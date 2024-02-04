import { TenTapBridge } from 'tentap';

type BubbleEditorState = {};

type BubbleEditorInstance = {};

declare module 'tentap' {
  interface EditorNativeState extends BubbleEditorState {}
  interface EditorInstance extends BubbleEditorInstance {}
}

export enum BubbleEditorActionType {
  OnComment = 'new-comment',
}

type BubbleMessage = {
  type: BubbleEditorActionType.OnComment;
};

export const BubbleMenuBridge = new TenTapBridge<
  BubbleEditorState,
  BubbleEditorInstance,
  BubbleMessage
>({
  forceName: 'sdfs',
  onEditorMessage: (message: BubbleMessage) => {
    if (message.type === BubbleEditorActionType.OnComment) {
      console.log('ddddd333');
      return true;
    }
    return true;
  },
});
