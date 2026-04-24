#!/usr/bin/env node
// Sync the version from src/package.json into the two installer files that
// can't read it at build time:
//   - installer/MonadCode.wxs    <Package ... Version="X.Y.Z">
//   - installer/build-msi.bat    -o ..\src\dist\MonadCode_vX.Y.Z_x64.msi
//
// Run automatically before `npm run build:exe` and `npm run build:msi`.
// Safe to run on its own; idempotent when files already match.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');  // .../MonadCode/
const PKG_JSON = path.join(ROOT, 'src', 'package.json');
const WXS_FILE = path.join(ROOT, 'installer', 'MonadCode.wxs');
const BAT_FILE = path.join(ROOT, 'installer', 'build-msi.bat');

function fail(msg) {
  console.error(`sync-version: ${msg}`);
  process.exit(1);
}

const version = require(PKG_JSON).version;
if (!version || typeof version !== 'string') {
  fail(`package.json has no "version" field`);
}

function patch(file, re, replacement, label) {
  if (!fs.existsSync(file)) fail(`missing file: ${file}`);
  const before = fs.readFileSync(file, 'utf8');
  if (!re.test(before)) fail(`could not find ${label} in ${path.basename(file)}`);
  const after = before.replace(re, replacement);
  if (after === before) {
    console.log(`  ${label.padEnd(20)} already at ${version}`);
    return false;
  }
  fs.writeFileSync(file, after, 'utf8');
  console.log(`  ${label.padEnd(20)} → ${version}`);
  return true;
}

console.log(`sync-version: target ${version}`);

// <Package Name="..." Manufacturer="..." Version="X.Y.Z" ...>
patch(
  WXS_FILE,
  /(\bVersion=")[^"]+(")/,
  `$1${version}$2`,
  'MonadCode.wxs'
);

// -o ..\src\dist\MonadCode_vX.Y.Z_x64.msi
patch(
  BAT_FILE,
  /(MonadCode_v)[^_\s"']+(_x64\.msi)/,
  `$1${version}$2`,
  'build-msi.bat'
);

console.log('sync-version: done');
