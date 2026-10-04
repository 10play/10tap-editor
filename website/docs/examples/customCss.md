---
sidebar_position: 2
---

# Custom CSS and Fonts

In this example we will be adding custom css and fonts

## Adding/Overriding CSS

Each bridge, gives us the option to `configureCSS`. Some bridges come with css already configured in them, when we can override by configuring.
Let's give an example by overriding the CodeBridge.

First let's define the css

```ts
const customCodeBlockCSS = `
code {
    background-color: #ffdede;
    border-radius: 0.25em;
    border-color: #e45d5d;
    border-width: 1px;
    border-style: solid;
    box-decoration-break: clone;
    color: #cd4242;
    font-size: 0.9rem;
    padding: 0.25em;
}
`;
```

Now let's configure the CodeBridge to use this css

```tsx
const editor = useEditorBridge({
  ...,
  bridgeExtensions: [
    // It is important to spread StarterKit BEFORE our extended plugin,
    // as plugin duplicated will be ignored
    ...TenTapStartKit,
    CodeBridge.configureCSS(customCodeBlockCSS), // Custom codeblock css
  ],
});
```

> <strong>NOTE</strong> calling configureCSS more than once will override the previous css.

## Dynamically Updating CSS

Let's say we want to dynamically update css after the editor is initialized.
We can do this with [injectCSS](../api/EditorBridge.md#injectcss).
`injectCSS` receives two parameters:

- `css`: the css to inject
- `tag`: the tag of the stylesheet of which to inject the css into

When we call `injectCSS` it gets or creates a stylesheet with the given `tag` and updates it's css.

If we wanted to update our `CodeBridge` css after it has been initialized we could run

```ts
editor.injectCSS(ourCustomCSS, CodeBridge.name);
```

then this would replace or create the existing css with whatever we have given it.

Now let's say that we don't want to override a bridges existing css, we could do this by providing a custom tag

```ts
editor.injectCSS(ourCustomCSS, 'our-custom-tag');
```

This will create a new stylesheet with `our-custom-tag` and it will not override any bridge's custom css.

`injectCSS` can be called at any time: calls made before the editor has loaded are queued, and the stylesheet is applied again if the WebView reloads.

## Adding Custom Fonts

There are two ways to load a font into the editor: from a file (recommended), or embedded as base64 in the CSS.

In both cases pass the CSS through `configureCSS` rather than `injectCSS`, so the font is part of the editor from the first paint.

### Loading fonts from a file

Loading the font from a local file avoids sending and parsing a large base64 string every time the editor loads.

1. Get a local file URI for the font. With Expo, use `expo-asset`; in a bare app, copy the font into your app bundle and build the path yourself.
2. Reference it from an `@font-face` rule and pass the CSS to `CoreBridge.configureCSS`.
3. Allow the WebView to read local files. On iOS, also set [webviewBaseURL](../api/useEditorBridge.md#webviewbaseurl) to a `file://` directory that contains the font.
4. Create the editor only once the URI is known, because bridge CSS is read when the editor is created.

```tsx
import { useAssets } from 'expo-asset';

export const EditorWithFont = () => {
  const [assets] = useAssets([require('./assets/Rubik-Regular.ttf')]);
  const fontUri = assets?.[0]?.localUri;
  if (!fontUri) return null;
  return <Editor fontUri={fontUri} />;
};

const Editor = ({ fontUri }: { fontUri: string }) => {
  const editor = useEditorBridge({
    webviewBaseURL: fontUri.substring(0, fontUri.lastIndexOf('/') + 1),
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(`
        @font-face {
          font-family: 'Rubik';
          src: url('${fontUri}');
        }
        * {
          font-family: 'Rubik', sans-serif;
        }
      `),
    ],
  });

  return (
    <RichText
      editor={editor}
      allowFileAccess
      allowFileAccessFromFileURLs
    />
  );
};
```

### Embedding fonts as base64

This needs no setup, at the cost of a larger editor HTML that is parsed on every load.

So first we need to download and convert our font, so we can inject it into the webview:

1. Upload your font files to https://transfonter.org and check the 'base64' option. When you download the zip file, there will be a `stylesheet.css` file there.
2. Copy the contents of the `stylesheet.css` into a new ts file and export it as a string.

```ts
export const ProtestRiotFont = `
  font-family: 'Protest Riot';
  src: url('data:font/woff2;charset=utf-8;base64,..........
  .......
`;
```

Now we can use our font as follows

```ts
const customFont = `
${ProtestRiotFont}
* {
    font-family: 'Protest Riot', sans-serif;
}
`;
```

And inside our `EditorBridge`

```tsx
const editor = useEditorBridge({
  bridgeExtensions: [
    // It is important to spread StarterKit BEFORE our extended plugin,
    // as plugin duplicated will be ignored
    ...TenTapStartKit,
    CoreBridge.configureCSS(customFont), // Custom font
  ],
});
```

## Chinese, Japanese and Korean text

The default editor doesn't set a font, so the WebView uses its default serif font. For CJK characters it then falls back to a system font that may have no bold or italic variant, and bold or italic text looks unchanged even though the marks are applied. Set a font stack that has CJK weights and let the WebView synthesize the missing styles:

```tsx
const editor = useEditorBridge({
  bridgeExtensions: [
    ...TenTapStartKit,
    CoreBridge.configureCSS(`
      .ProseMirror {
        font-family: -apple-system, system-ui, 'PingFang SC', 'Hiragino Sans GB',
          'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
        font-synthesis: weight style;
      }
    `),
  ],
});
```

The default font is unchanged in 1.x so existing editors look the same.
