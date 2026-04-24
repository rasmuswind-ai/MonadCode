const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getSecretsPath } = require('./paths');

const SECRETS_PATH = getSecretsPath();
const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_VALUE_BYTES = 10 * 1024;

// Run a short PowerShell program, piping the script via stdin so secret data
// never appears on the command line. Returns trimmed stdout on success.
function runPwshScript(psScript) {
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '-'], {
      windowsHide: true,
    });
    let out = '';
    let err = '';
    ps.stdout.on('data', (d) => { out += d.toString(); });
    ps.stderr.on('data', (d) => { err += d.toString(); });
    ps.on('error', reject);
    ps.on('close', (code) => {
      if (code !== 0) return reject(new Error(`PowerShell exited ${code}: ${err.trim()}`));
      resolve(out.trim());
    });
    ps.stdin.write(psScript);
    ps.stdin.end();
  });
}

// Encrypt a UTF-8 string using DPAPI (LocalMachine scope) and return base64.
async function dpapiEncrypt(plaintext) {
  const b64plain = Buffer.from(plaintext, 'utf8').toString('base64');
  const script = `
Add-Type -AssemblyName System.Security;
$b = [Convert]::FromBase64String('${b64plain}');
$enc = [System.Security.Cryptography.ProtectedData]::Protect($b, $null, 'LocalMachine');
[Convert]::ToBase64String($enc)
`;
  return runPwshScript(script);
}

// Decrypt a base64-encoded DPAPI blob back to its original UTF-8 string.
async function dpapiDecrypt(ciphertextB64) {
  const script = `
Add-Type -AssemblyName System.Security;
$b = [Convert]::FromBase64String('${ciphertextB64}');
$dec = [System.Security.Cryptography.ProtectedData]::Unprotect($b, $null, 'LocalMachine');
[Convert]::ToBase64String($dec)
`;
  const b64 = await runPwshScript(script);
  return Buffer.from(b64, 'base64').toString('utf8');
}

function loadStore() {
  try {
    if (fs.existsSync(SECRETS_PATH)) {
      const raw = fs.readFileSync(SECRETS_PATH, 'utf8');
      const data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : {};
    }
  } catch (err) {
    console.error('Error loading secrets store, starting fresh:', err.message);
  }
  return {};
}

function saveStore(store) {
  const dir = path.dirname(SECRETS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function validateName(name) {
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    throw new Error('Secret name must match /^[A-Za-z_][A-Za-z0-9_]*$/');
  }
}

// Public API ────────────────────────────────────────────────────────────────

// List secret names + creation timestamps. Never returns values.
function list() {
  const store = loadStore();
  return Object.entries(store)
    .map(([name, entry]) => ({ name, createdAt: entry.createdAt }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

async function set(name, value) {
  validateName(name);
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Secret value must be a non-empty string');
  }
  if (Buffer.byteLength(value, 'utf8') > MAX_VALUE_BYTES) {
    throw new Error(`Secret value exceeds ${MAX_VALUE_BYTES} bytes`);
  }
  const ciphertext = await dpapiEncrypt(value);
  const store = loadStore();
  store[name] = { ciphertext, createdAt: new Date().toISOString() };
  saveStore(store);
  return { name, createdAt: store[name].createdAt };
}

function remove(name) {
  validateName(name);
  const store = loadStore();
  if (!(name in store)) return false;
  delete store[name];
  saveStore(store);
  return true;
}

// Decrypt a specific set of names. Missing names are silently omitted so
// scripts can still run (the $Secret hashtable will just lack the key).
// Lookup is case-insensitive to match PowerShell's variable + hashtable key
// semantics — users intuitively expect $secret.foo and $Secret.Foo to resolve
// the same thing regardless of how the secret was saved.
async function resolveMany(names) {
  const store = loadStore();
  const lowerIndex = new Map(Object.keys(store).map((k) => [k.toLowerCase(), k]));
  const result = new Map();
  for (const name of names) {
    if (!NAME_RE.test(name)) continue;
    const storeKey = lowerIndex.get(name.toLowerCase());
    if (!storeKey) continue;
    try {
      const value = await dpapiDecrypt(store[storeKey].ciphertext);
      // Inject under the name the script actually referenced. Hashtable keys
      // in PS are case-insensitive anyway, but this keeps the injected
      // header obviously matching the source for the user.
      result.set(name, value);
    } catch (err) {
      console.error(`Failed to decrypt secret "${storeKey}":`, err.message);
    }
  }
  return result;
}

module.exports = { list, set, remove, resolveMany };
