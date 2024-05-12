import { BoldBridge } from './bold';
import { CodeBridge } from './code';
import { ItalicBridge } from './italic';
import { HistoryBridge } from './history';
import { StrikeBridge } from './strike';
import { OrderedListBridge } from './orderedList';
import { HeadingBridge } from './heading';
import { ListItemBridge } from './listItem';
import { BulletListBridge } from './bulletList';
import { BlockquoteBridge } from './blockquote';
import { UnderlineBridge } from './underline';
import { TaskListBridge } from './tasklist';
import { LinkBridge } from './link';
import { ColorBridge } from './color';
import { HighlightBridge } from './highlight';
import { CoreBridge } from './core';
import { ImageBridge } from './image';
import { PlaceholderBridge } from './placeholder';
import { DropCursorBridge } from './dropcursor';
import { HardBreakBridge } from './br';

export const TenTapStartKit = [
  BoldBridge,
  HistoryBridge,
  CodeBridge,
  ItalicBridge,
  StrikeBridge,
  UnderlineBridge,
  OrderedListBridge,
  HeadingBridge,
  ImageBridge,
  BulletListBridge,
  BlockquoteBridge,
  TaskListBridge,
  LinkBridge,
  ColorBridge,
  HighlightBridge,
  CoreBridge,
  PlaceholderBridge,
  ListItemBridge,
  DropCursorBridge,
  HardBreakBridge,
];
