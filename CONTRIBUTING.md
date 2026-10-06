# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

Open issues for things to work on!

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- A bare React Native example app in the `example/` directory (React Native 0.81, runs on both the new and the old architecture).
- An Expo example app in the `example-expo/` directory (Expo SDK 57 with a dev client, new architecture only).
- The web E2E app in the `e2e-web/` directory and the docs website in the `website/` directory.

Development needs Node.js 20.19 or newer (the version in `.nvmrc` is used in CI), although the published package supports Node.js 18.

To get started with the project, run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

Both example apps are configured to use the local version of the library, so any changes you make to the library's source code will be reflected in them. Changes to the library's JavaScript code will be reflected without a rebuild, but native code changes will require a rebuild of the app.

If you want to use Android Studio or Xcode to edit the native code, you can open the `example/android` or `example/ios` directories respectively in those editors. To edit the Objective-C files, open `example/ios/TenTapExample.xcworkspace` in Xcode and find the source files at `Pods > Development Pods > tentap`.

To edit the Java or Kotlin files, open `example/android` in Android Studio and find the source files at `tentap` under `Android`.

You can use various commands from the root directory to work with the project.

Before running the examples you must build the editor
To build the editor:

```sh
yarn editor:build
```

The example's Advanced screen loads its own editor bundle. Build it once with:

```sh
yarn editor:build-web-utils
yarn example editor:build
```

If you are working on the web side of the editor and you want to have hot reload enabled you need to do the following

1. run `yarn editor:dev`
2. inside `useEditorBridge` set `DEV: true`

```tsx
const editor = useEditorBridge({
  DEV: true,
  DEV_SERVER_URL: 'http://locahost:1234', // (OPTIONAL) - if the dev server is running on a different port
});
```

Install the iOS pods once (and again after native changes):

```sh
yarn example pods
```

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

The example builds with the new architecture by default. To try the old architecture:

1. For Android, run:

   ```sh
   yarn example build:android:oldarch
   ```

   or pass `-PnewArchEnabled=false` to Gradle when running from Android Studio.

2. For iOS, reinstall the pods with the old architecture and run the app again:

   ```sh
   yarn example pods:oldarch
   yarn example ios
   ```

If you are building for a different architecture than your previous build, make sure to remove the build folders first. You can run the following command to cleanup all build folders:

```sh
yarn clean
```

The example's home screen shows which architecture it is running on.

The Maestro flows in `example/.maestro` cover the editor and the custom keyboard. With a build installed on a simulator or emulator, run them with:

```sh
yarn example e2e
```

The Expo example uses a development build, so it can't run in Expo Go. To run it:

```sh
yarn example:expo ios
yarn example:expo android
yarn example:expo web
```

`yarn example:expo prebuild` regenerates its native projects; `example-expo/ios` and `example-expo/android` are not committed.

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typecheck
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
yarn release
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn`: setup project by installing dependencies.
- `yarn editor:build`: build the editor
- `yarn editor:dev`: run the editor dev server
- `yarn typecheck`: type-check files with TypeScript.
- `yarn lint`: lint files with ESLint.
- `yarn test`: run unit tests with Jest.
- `yarn test:web`: run the web-side unit tests with Vitest.
- `yarn e2e:web`: run the web E2E tests with Playwright.
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.
- `yarn example typecheck`: type-check the example app.
- `yarn example:expo start`: start the Metro server for the Expo example's development build.
- `yarn example:expo typecheck`: type-check the Expo example.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
