const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getExePath, getExeDir } = require('./lib/paths');

const SERVICE_ID = 'MonadCode';
const DISPLAY_NAME = 'Monad Code';
const DESCRIPTION = 'Lightweight PowerShell script scheduler with web UI';

const command = (process.argv[2] || '').toLowerCase();

switch (command) {
  case 'run':
    run();
    break;
  case 'install':
    install();
    break;
  case 'uninstall':
    uninstall();
    break;
  case 'status':
    status();
    break;
  default:
    printUsage();
    break;
}

// ── Commands ────────────────────────────────────────

function run() {
  const { startServer } = require('./server');
  startServer();
}

function install() {
  const exeDir = getExeDir();
  const exePath = getExePath();
  const svcExePath = path.join(exeDir, `${SERVICE_ID}-svc.exe`);
  const svcXmlPath = path.join(exeDir, `${SERVICE_ID}-svc.xml`);
  const svcConfigPath = path.join(exeDir, `${SERVICE_ID}-svc.exe.config`);

  console.log(`Installing "${DISPLAY_NAME}" service...`);
  console.log(`  exe: ${exePath}`);
  console.log(`  dir: ${exeDir}`);
  console.log();

  // 1. Copy winsw wrapper next to the main exe
  const winswSource = getWinswPath();
  if (!winswSource) {
    console.error('Could not find winsw.exe. Make sure node-windows is installed (dev) or winsw.exe is in the same folder.');
    process.exit(1);
  }

  fs.copyFileSync(winswSource, svcExePath);

  // Copy the .NET config if available
  const winswConfigSource = winswSource + '.config';
  if (fs.existsSync(winswConfigSource)) {
    fs.copyFileSync(winswConfigSource, svcConfigPath);
  }

  // 2. Generate the XML config for winsw
  const xml = `<service>
  <id>${SERVICE_ID}</id>
  <name>${DISPLAY_NAME}</name>
  <description>${DESCRIPTION}</description>
  <executable>${exePath}</executable>
  <argument>run</argument>
  <workingdirectory>${exeDir}</workingdirectory>
  <log mode="roll-by-size">
    <sizeThreshold>10240</sizeThreshold>
    <keepFiles>3</keepFiles>
  </log>
  <onfailure action="restart" delay="5 sec" />
</service>
`;
  fs.writeFileSync(svcXmlPath, xml, 'utf8');

  // 3. Install and start via winsw
  try {
    exec(`"${svcExePath}" install`);
    console.log('Service registered. Starting...');
    exec(`"${svcExePath}" start`);

    console.log();
    console.log('Done! Monad Code is running.');
    console.log('Open http://127.0.0.1:5088 in your browser.');
  } catch (err) {
    console.error();
    console.error('Failed. Make sure you run this as Administrator.');
    process.exit(1);
  }
}

function uninstall() {
  const exeDir = getExeDir();
  const svcExePath = path.join(exeDir, `${SERVICE_ID}-svc.exe`);
  const svcXmlPath = path.join(exeDir, `${SERVICE_ID}-svc.xml`);
  const svcConfigPath = path.join(exeDir, `${SERVICE_ID}-svc.exe.config`);

  if (!fs.existsSync(svcExePath)) {
    console.log('Service wrapper not found. Is the service installed?');
    console.log(`  Expected: ${svcExePath}`);
    process.exit(1);
  }

  try {
    console.log(`Stopping "${DISPLAY_NAME}" service...`);
    try { exec(`"${svcExePath}" stop`); } catch (_) { /* may not be running */ }

    console.log('Removing service...');
    exec(`"${svcExePath}" uninstall`);

    // Clean up the wrapper files
    try { fs.unlinkSync(svcExePath); } catch (_) {}
    try { fs.unlinkSync(svcXmlPath); } catch (_) {}
    try { fs.unlinkSync(svcConfigPath); } catch (_) {}

    console.log('Done! Service removed.');
  } catch (err) {
    console.error();
    console.error('Failed. Make sure you run this as Administrator.');
    process.exit(1);
  }
}

function status() {
  try {
    execSync(`sc query ${SERVICE_ID}`, { stdio: 'inherit' });
  } catch (_) {
    console.log(`Service "${DISPLAY_NAME}" is not installed.`);
  }
}

function printUsage() {
  console.log();
  console.log('  Monad Code - PowerShell Script Scheduler');
  console.log('  =========================================');
  console.log();
  console.log('  Usage:  monadcode.exe <command>');
  console.log();
  console.log('  Commands:');
  console.log('    install     Register and start as a Windows service');
  console.log('    uninstall   Stop and remove the Windows service');
  console.log('    run         Run the server directly (foreground)');
  console.log('    status      Check if the service is running');
  console.log();
  console.log('  The install/uninstall commands require an elevated (Admin) prompt.');
  console.log();
}

// ── Helpers ─────────────────────────────────────────

function exec(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function getWinswPath() {
  // When running as pkg exe: look for winsw.exe next to the exe
  const exeDir = getExeDir();
  const beside = path.join(exeDir, 'winsw.exe');
  if (fs.existsSync(beside)) return beside;

  // Dev mode: look inside node_modules
  const nmPath = path.join(__dirname, 'node_modules', 'node-windows', 'bin', 'winsw', 'winsw.exe');
  if (fs.existsSync(nmPath)) return nmPath;

  return null;
}
