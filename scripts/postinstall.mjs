import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Runs automatically after `npm install` (e.g. on Antideploy).
// Builds the React frontend into backend/public so the Express
// server can serve the SPA. Never fails the install: if the build
// cannot run, it falls back to an existing pre-built frontend.

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(path.dirname(__filename)); // repository root
const frontendDir = path.join(root, 'frontend');
const distDir = path.join(frontendDir, 'dist');
const publicDir = path.join(root, 'backend', 'public');
const viteBin = path.join(root, 'node_modules', '.bin', 'vite');

function copyDistToPublic() {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.cpSync(distDir, publicDir, { recursive: true });
}

try {
  if (fs.existsSync(viteBin)) {
    console.log('[postinstall] Building frontend into backend/public...');
    execSync(`"${viteBin}" build "${frontendDir}"`, { stdio: 'inherit', cwd: root });
    copyDistToPublic();
    console.log('[postinstall] Frontend ready in backend/public');
  } else if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    console.log('[postinstall] Using pre-built frontend in backend/public');
  } else {
    console.warn('[postinstall] vite not found and no pre-built frontend. Run "npm run build:prod".');
  }
} catch (err) {
  console.warn('[postinstall] Frontend build failed:', err.message);
  if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
    console.warn('[postinstall] WARNING: backend/public/index.html is missing. Run "npm run build:prod".');
  }
}

process.exit(0);
