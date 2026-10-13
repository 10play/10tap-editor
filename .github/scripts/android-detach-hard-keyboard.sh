#!/usr/bin/env bash
# Detaches the hardware keyboard that the x86_64 Android emulator exposes on
# Linux runners, so the device reports `nokeys` like a phone does.
#
# With a hardware keyboard in the configuration (`am get-config` shows
# `-qwerty-`), Chromium leaves the soft keyboard up for `inputmode="none"`,
# which is how the custom keyboard's fallback driver hides it (used in a
# Modal on Android). Real phones report `nokeys`.
#
# Needs a rootable image (google_apis). Usage, with the emulator booted:
#   .github/scripts/android-detach-hard-keyboard.sh [device name...]
# Device names default to every non-virtual alphabetic keyboard.
set -euo pipefail

config() { adb shell am get-config | head -n 1; }

echo "Before: $(config)"

if [ "$#" -gt 0 ]; then
  names=("$@")
else
  names=()
  while IFS= read -r name; do
    [ -n "$name" ] && names+=("$name")
  done < <(
    adb shell dumpsys input | tr -d '\r' | awk '
      /^  Device -?[0-9]+: / { sub(/^  Device -?[0-9]+: /, ""); name = $0 }
      /^    KeyboardType: 2$/ && name != "Virtual" { print name }
    '
  )
fi

if [ "${#names[@]}" -eq 0 ]; then
  echo "No hardware keyboard to detach."
  exit 0
fi

if ! adb root >/dev/null; then
  echo "::warning::adb root is not available; the hardware keyboard stays."
  exit 0
fi
adb wait-for-device
for name in "${names[@]}"; do
  echo "Detaching \"$name\""
  # The input node's device is bound to a driver (virtio_input, a platform
  # driver); unbinding it removes the input device.
  adb shell "for i in /sys/class/input/input*; do
    [ \"\$(cat \$i/name)\" = '$name' ] || continue
    dev=\$(readlink -f \$i/device)
    [ -e \$dev/driver ] || dev=\$(readlink -f \$dev/..)
    echo \$(basename \$dev) > \$dev/driver/unbind && echo \"  unbound \$(basename \$dev)\"
  done" || echo "::warning::Could not detach \"$name\"."
done
adb unroot >/dev/null || true
adb wait-for-device
sleep 2

after=$(config)
echo "After: $after"
case "$after" in
  *-qwerty-*) echo "::warning::The emulator still reports a hardware keyboard." ;;
esac
