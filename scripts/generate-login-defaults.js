/**
 * Reads .env and generates src/environments/login-defaults.generated.ts
 * for dev form defaults. Run via npm run prestart/prebuild or postinstall.
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const outDir = path.join(__dirname, '..', 'src', 'environments');
const outPath = path.join(outDir, 'login-defaults.generated.ts');

let email = '';
let password = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*TTB_DEV_EMAIL\s*=\s*(.+?)\s*$/);
    if (m) email = (m[1] || '').replace(/^["']|["']$/g, '').trim();
    const p = line.match(/^\s*TTB_DEV_PASSWORD\s*=\s*(.+?)\s*$/);
    if (p) password = (p[1] || '').replace(/^["']|["']$/g, '').trim();
  });
}

function escape(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const ts = `/** Auto-generated from .env - do not commit if it contains real credentials. */
export const LOGIN_DEFAULTS = {
  email: '${escape(email)}',
  password: '${escape(password)}'
};
`;

fs.writeFileSync(outPath, ts, 'utf8');
console.log('Generated login-defaults.generated.ts from .env');
