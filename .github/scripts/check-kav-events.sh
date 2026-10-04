#!/usr/bin/env bash
# The custom keyboard swaps its slot in the same keyboard event that RN's
# KeyboardAvoidingView reacts to: keyboardWillShow/WillHide on iOS and
# keyboardDidShow/DidHide on Android. Fails if a React Native release changes
# which events the KeyboardAvoidingView listens to.
#
# Usage: check-kav-events.sh <react-native package dir>
set -euo pipefail

rn_dir=${1:?usage: check-kav-events.sh <react-native package dir>}
kav="$rn_dir/Libraries/Components/Keyboard/KeyboardAvoidingView.js"

if [[ ! -f "$kav" ]]; then
  echo "KeyboardAvoidingView not found at $kav" >&2
  exit 1
fi

status=0
for event in keyboardWillShow keyboardWillHide keyboardDidShow keyboardDidHide; do
  if ! grep -q "Keyboard.addListener('$event'" "$kav"; then
    echo "KeyboardAvoidingView no longer listens to $event" >&2
    status=1
  fi
done
exit $status
