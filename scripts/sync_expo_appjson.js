// tools/sync_expo_appjson.js
// Usage: node tools/sync_expo_appjson.js
// Idempotent: updates expo/app.json with version from root package.json

const fs = require("fs");
const path = require("path");

const rootPkgPath = path.resolve(__dirname, "..", "package.json");
const appJsonPath = path.resolve(__dirname, "..", "expo", "app.json");

function parseSemver(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?/.exec(v);
  if (!m) return null;
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    rest: m[4] || "",
  };
}

// Read root package.json
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
const version = String(rootPkg.version || "0.0.0");

// Read expo app.json
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

// Compute android.versionCode (monotonic integer).
// Strategy: major * 1_000_000 + minor * 1_000 + patch
// => supports major up to thousands, patch up to 999.
const sem = parseSemver(version) || { major: 0, minor: 0, patch: 0 };
const androidVersionCode = sem.major * 1000000 + sem.minor * 1000 + sem.patch;

// Update fields
let changed = false;
if (appJson.expo == null) appJson.expo = {};

if (appJson.expo.version !== version) {
  appJson.expo.version = version;
  changed = true;
}
if (!appJson.expo.android) appJson.expo.android = {};
if (appJson.expo.android.versionCode !== androidVersionCode) {
  appJson.expo.android.versionCode = androidVersionCode;
  changed = true;
}
if (!appJson.expo.ios) appJson.expo.ios = {};
if (appJson.expo.ios.buildNumber !== version) {
  appJson.expo.ios.buildNumber = version;
  changed = true;
}

// Write back if changed
if (changed) {
  fs.writeFileSync(
    appJsonPath,
    JSON.stringify(appJson, null, 2) + "\n",
    "utf8",
  );
  console.log(
    `expo/app.json updated — version=${version}, android.versionCode=${androidVersionCode}`,
  );
} else {
  console.log("expo/app.json already in sync");
}
