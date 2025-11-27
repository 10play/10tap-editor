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
We can do this with [injectCSS](../api/EditorBridge/#injectcss).
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

## Adding Custom Fonts

Let's add a custom font to our Editor (we can also add custom css)

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
