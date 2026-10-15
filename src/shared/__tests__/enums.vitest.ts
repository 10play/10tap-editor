import { describe, expect, it } from 'vitest';
import { wireFixtures } from '../../__fixtures__/wire';
import { BlockquoteEditorActionType } from '../../bridges/blockquote';
import { BoldEditorActionType } from '../../bridges/bold';
import { HardBreakEditorActionType } from '../../bridges/br';
import { BulletListEditorActionType } from '../../bridges/bulletList';
import { CodeEditorActionType } from '../../bridges/code';
import { ColorEditorActionType } from '../../bridges/color';
import { CoreEditorActionType } from '../../bridges/core';
import { HeadingEditorActionType } from '../../bridges/heading';
import { HighlightEditorActionType } from '../../bridges/highlight';
import { HistoryEditorActionType } from '../../bridges/history';
import { ImageEditorActionType } from '../../bridges/image';
import { ItalicEditorActionType } from '../../bridges/italic';
import { LinkEditorActionType } from '../../bridges/link';
import { ListItemEditorActionType } from '../../bridges/listItem';
import { OrderedListEditorActionType } from '../../bridges/orderedList';
import { PlaceholderEditorActionType } from '../../bridges/placeholder';
import { StrikeEditorActionType } from '../../bridges/strike';
import { TaskListEditorActionType } from '../../bridges/tasklist';
import { UnderlineEditorActionType } from '../../bridges/underline';
import { EditorActionType, EditorUpdateSettings } from '../../types/Actions';
import { EditorMessageType } from '../../types/Messaging';

// Runs under vitest because the bridge modules import tiptap and the DOM.
const ENUMS: Record<string, Record<string, string>> = {
  BlockquoteEditorActionType,
  BoldEditorActionType,
  BulletListEditorActionType,
  CodeEditorActionType,
  ColorEditorActionType,
  CoreEditorActionType,
  EditorActionType,
  EditorMessageType,
  EditorUpdateSettings,
  HardBreakEditorActionType,
  HeadingEditorActionType,
  HighlightEditorActionType,
  HistoryEditorActionType,
  ImageEditorActionType,
  ItalicEditorActionType,
  LinkEditorActionType,
  ListItemEditorActionType,
  OrderedListEditorActionType,
  PlaceholderEditorActionType,
  StrikeEditorActionType,
  TaskListEditorActionType,
  UnderlineEditorActionType,
};

const members = Object.entries(ENUMS).flatMap(([enumName, values]) =>
  Object.entries(values).map(([member, value]) => ({ enumName, member, value }))
);

describe('wire fixtures against the exported enums', () => {
  it.each(members)(
    'cover $enumName.$member = "$value"',
    ({ enumName, member, value }) => {
      const fixtures = wireFixtures.filter(
        (fixture) => fixture.enum === enumName && fixture.member === member
      );
      expect(fixtures.length).toBeGreaterThan(0);
      for (const fixture of fixtures) expect(fixture.message.type).toBe(value);
    }
  );

  // Members added in 1.1 (insert-content, get-selected-text, …) are locked by
  // their fixtures alone until the bridge enums declare them.
  it('only name enums that exist', () => {
    for (const fixture of wireFixtures) {
      if (fixture.enum) expect(Object.keys(ENUMS)).toContain(fixture.enum);
    }
  });
});
