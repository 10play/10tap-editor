# exampleoldarch

React Native 0.76 app that runs the `examplelatest` screens on the old
architecture (Paper and the bridge). It is also the RN 0.76 new architecture
build when the flag is switched on.

| Variant | Android | iOS |
|---|---|---|
| Old architecture (default) | `yarn exampleoldarch build:android` | `yarn exampleoldarch pods && yarn exampleoldarch build:ios` |
| New architecture | `yarn exampleoldarch build:android -PnewArchEnabled=true` | `RCT_NEW_ARCH_ENABLED=1 yarn exampleoldarch pods && yarn exampleoldarch build:ios` |

Run it with `yarn exampleoldarch start` and `yarn exampleoldarch android` (or
`ios`).

The screens are imported from `../examplelatest/src`. `metro.config.js`
resolves React and every native package from this app, so those screens get
React 18 and the RN 0.76 native modules instead of the copies next to
`examplelatest`.

## E2E

The Maestro flows live in `examplelatest/.maestro` and take the app id as a
parameter:

```sh
yarn exampleoldarch build:android:release
adb install -r exampleoldarch/android/app/build/outputs/apk/release/app-release.apk
yarn exampleoldarch e2e
```

On iOS, pass `-e APP_ID=org.reactjs.native.example.exampleoldarch`.
