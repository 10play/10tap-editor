#!/usr/bin/env bash
# Boots the first available iPhone simulator and installs an app on it.
#
# Usage: boot-ios-simulator.sh <path to .app>
set -euo pipefail

app=${1:?usage: boot-ios-simulator.sh <path to .app>}

udid=$(xcrun simctl list devices available --json | node -e '
  let json = "";
  process.stdin.on("data", (d) => (json += d)).on("end", () => {
    const runtimes = Object.entries(JSON.parse(json).devices)
      .filter(([runtime]) => runtime.includes("iOS"))
      .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }));
    for (const [, devices] of runtimes) {
      const phone = devices.find((d) => d.name.startsWith("iPhone"));
      if (phone) return console.log(phone.udid);
    }
    process.exit(1);
  });
')

echo "Booting simulator $udid"
xcrun simctl boot "$udid"
xcrun simctl bootstatus "$udid" -b
xcrun simctl install "$udid" "$app"
