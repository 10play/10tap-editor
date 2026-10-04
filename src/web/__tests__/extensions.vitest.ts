import { describe, expect, it } from 'vitest';
import BridgeExtension from '../../bridges/base';
import { BulletListBridge } from '../../bridges/bulletList';
import { ColorBridge } from '../../bridges/color';
import { HighlightBridge } from '../../bridges/highlight';
import { HistoryBridge } from '../../bridges/history';
import { ListItemBridge } from '../../bridges/listItem';
import { buildBridgeConfigs } from '../../shared/bootConfig';
import { resolveBridgeExtensions, selectActiveBridges } from '../extensions';

const names = (extensions: { name: string }[]) =>
  extensions.map(({ name }) => name);

describe('selectActiveBridges', () => {
  it('keeps bridges that have a config entry or are whitelisted', () => {
    const cssOnly = new BridgeExtension({ forceName: 'cssOnly' });
    const active = selectActiveBridges(
      [ColorBridge, HighlightBridge, cssOnly],
      {
        bridgeConfigs: buildBridgeConfigs([ColorBridge]),
        whitelist: ['cssOnly'],
      }
    );

    expect(active).toEqual([ColorBridge, cssOnly]);
  });

  it('finds HistoryBridge under its 0.7.x name', () => {
    const active = selectActiveBridges([HistoryBridge], {
      bridgeConfigs: { history: { optionsConfig: { depth: 3 } } },
      whitelist: ['history'],
    });

    expect(active).toEqual([HistoryBridge]);
  });
});

describe('resolveBridgeExtensions', () => {
  it('configures through the history alias without mutating the bridge', () => {
    const original = HistoryBridge.tiptapExtension;
    const [history] = resolveBridgeExtensions([HistoryBridge], {
      bridgeConfigs: { history: { optionsConfig: { depth: 3 } } },
    });

    expect(history?.options).toMatchObject({ depth: 3 });
    expect(HistoryBridge.tiptapExtension).toBe(original);
  });

  it('includes shared dependencies once', () => {
    const extensions = resolveBridgeExtensions([ColorBridge, HighlightBridge], {
      bridgeConfigs: {},
    });

    expect(names(extensions)).toEqual(['color', 'textStyle', 'highlight']);
  });

  it("prefers a bridge's own extension over another bridge's dependency", () => {
    const listItem = ListItemBridge.configureExtension({
      HTMLAttributes: { class: 'item' },
    });
    const extensions = resolveBridgeExtensions([BulletListBridge, listItem], {
      bridgeConfigs: buildBridgeConfigs([BulletListBridge, listItem]),
    });

    expect(names(extensions)).toEqual(['bulletList', 'listItem']);
    expect(extensions[1]?.options).toMatchObject({
      HTMLAttributes: { class: 'item' },
    });
  });

  it('adds nothing for CSS-only bridges', () => {
    const cssOnly = new BridgeExtension({
      forceName: 'cssOnly',
      extendCSS: 'p {}',
    });

    expect(resolveBridgeExtensions([cssOnly], { bridgeConfigs: {} })).toEqual(
      []
    );
  });
});
