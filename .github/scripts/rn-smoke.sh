#!/usr/bin/env bash
# Generates a bare React Native app, installs the packed library into it and
# builds a release Android APK (JS bundle included), then checks autolinking.
#
# Usage: rn-smoke.sh <react-native version|nightly> <dir with the packed .tgz> [gradle args...]
set -euo pipefail

version=${1:?usage: rn-smoke.sh <version> <workdir> [gradle args...]}
workdir=${2:?usage: rn-smoke.sh <version> <workdir> [gradle args...]}
shift 2

scripts_dir=$(cd "$(dirname "$0")" && pwd)
tarball=$(find "$workdir" -maxdepth 1 -name '10play-tentap-editor-*.tgz' -print -quit)
if [[ -z "$tarball" ]]; then
  echo "No packed library in $workdir; run npm pack first." >&2
  exit 1
fi

webview=react-native-webview
if [[ "$version" != nightly ]]; then
  # The last webview release line that still supports the RN native floor.
  webview=react-native-webview@13.12.5
fi

cd "$workdir"
rm -rf RNSmoke
npx --yes @react-native-community/cli@latest init RNSmoke \
  --version "$version" --skip-install --skip-git-init --install-pods false

install_flags=(--no-audit --no-fund)
if [[ "$version" == nightly || "$version" == *-* ]]; then
  # A prerelease never satisfies the library's `>=0.74` peer range, which
  # npm treats as a hard conflict.
  install_flags+=(--legacy-peer-deps)
fi

cd RNSmoke
npm install "${install_flags[@]}"
npm install "${install_flags[@]}" "$tarball" "$webview"
cp "$scripts_dir/smoke-app/App.tsx" App.tsx

(cd android && ./gradlew assembleRelease --console=plain -PreactNativeArchitectures=x86_64 "$@")
"$scripts_dir/check-autolinking.sh" android
