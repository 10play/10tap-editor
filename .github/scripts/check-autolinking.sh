#!/usr/bin/env bash
# Fails unless React Native autolinking registered the library in a built
# Android app. Older CLIs skip packages they cannot detect without an error.
#
# Usage: check-autolinking.sh <app android dir>
set -euo pipefail

android_dir=${1:?usage: check-autolinking.sh <app android dir>}
package_list=$(find "$android_dir/app/build/generated" -name PackageList.java -print -quit 2>/dev/null || true)

if [[ -z "$package_list" ]]; then
  echo "No PackageList.java under $android_dir/app/build/generated; build the app first." >&2
  exit 1
fi
if ! grep -q 'new TenTapViewPackage()' "$package_list"; then
  echo "TenTapViewPackage is not autolinked in $package_list" >&2
  exit 1
fi
echo "TenTapViewPackage is autolinked ($package_list)"
