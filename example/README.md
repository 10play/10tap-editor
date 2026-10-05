# TenTap Example

React Native 0.81 app with every 10tap example: the basic and toolbar screens,
the Advanced screen with its own web editor bundle, the custom keyboard
examples and the repro screens the Maestro flows drive. RN 0.81 is the last
release where the new architecture can be switched off, so this one app covers
both architectures. The home screen shows which one is running.

The app consumes the library from `../src`. `metro.config.js` resolves React
and every package with native code from this app, so the library gets the same
React and React Native copies as the app.

## Run

```sh
yarn install
yarn example pods        # iOS, new architecture
yarn example start
yarn example ios         # or: yarn example android
```

## Architectures

| Variant | Android | iOS |
|---|---|---|
| New architecture (default) | `yarn example build:android` | `yarn example pods && yarn example build:ios` |
| Old architecture | `yarn example build:android:oldarch` | `yarn example pods:oldarch && yarn example build:ios` |

`pods` / `pods:oldarch` set `RCT_NEW_ARCH_ENABLED` and update
`RCTNewArchEnabled` in Info.plist, so rerun the matching one when switching.

## Advanced example

The Advanced screen loads a custom web editor bundle. Build it once (and after
changing `src/Examples/Advanced/editor-web`):

```sh
yarn editor:build-web-utils   # from the repo root
yarn example editor:build
```

`yarn example editor:dev` serves the web editor on port 3000 for live editing.

## E2E

The Maestro flows in `.maestro` use the app id `dev.tenplay.tentapexample` on
both platforms:

```sh
yarn example e2e
```
