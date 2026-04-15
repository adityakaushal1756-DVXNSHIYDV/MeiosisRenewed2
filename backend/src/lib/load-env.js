const fs = require('fs');
const path = require('path');

function stripQuotes(value) {
  if (!value) return value;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function applyEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const source = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = stripQuotes(line.slice(separatorIndex + 1).trim());

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

function loadEnv() {
  const backendRoot = path.resolve(__dirname, '..', '..');
  applyEnvFile(path.join(backendRoot, '.env'));
  applyEnvFile(path.join(backendRoot, '.env.local'));
}

module.exports = loadEnv;
