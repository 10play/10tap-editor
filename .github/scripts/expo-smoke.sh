#!/usr/bin/env bash
# Generates an Expo app for one SDK, installs the packed library, runs
# `expo prebuild` and builds the native project (dev-client / prebuild users).
#
# Usage: expo-smoke.sh <sdk> <android|ios> <dir with the packed .tgz>
set -euo pipefail

sdk=${1:?usage: expo-smoke.sh <sdk> <android|ios> <workdir>}
platform=${2:?usage: expo-smoke.sh <sdk> <android|ios> <workdir>}
workdir=${3:?usage: expo-smoke.sh <sdk> <android|ios> <workdir>}

scripts_dir=$(cd "$(dirname "$0")" && pwd)
tarball=$(find "$workdir" -maxdepth 1 -name '10play-tentap-editor-*.tgz' -print -quit)
if [[ -z "$tarball" ]]; then
  echo "No packed library in $workdir; run npm pack first." >&2
  exit 1
fi

cd "$workdir"
rm -rf ExpoSmoke
npx --yes create-expo-app@latest ExpoSmoke --template "blank-typescript@sdk-$sdk" --no-install

cd ExpoSmoke
npm install --no-audit --no-fund
npx expo install react-native-webview
npm install --no-audit --no-fund "$tarball"
cp "$scripts_dir/smoke-app/App.tsx" App.tsx

npx expo prebuild --platform "$platform" --no-install
case "$platform" in
  android)
    (cd android && ./gradlew assembleRelease --console=plain -PreactNativeArchitectures=x86_64)
    "$scripts_dir/check-autolinking.sh" android
    ;;
  ios)
    (cd ios && pod install)
    if ! grep -q '^  - tentap ' ios/Podfile.lock; then
      echo "The tentap pod is not autolinked" >&2
      exit 1
    fi
    xcodebuild -workspace ios/ExpoSmoke.xcworkspace -scheme ExpoSmoke \
      -configuration Release -sdk iphonesimulator \
      -destination 'generic/platform=iOS Simulator' \
      CODE_SIGNING_ALLOWED=NO -quiet build
    ;;
  *)
    echo "Unknown platform: $platform" >&2
    exit 1
    ;;
esac
