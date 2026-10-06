import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(path.dirname(__filename)); // parent of scripts/

const distDir = path.join(root, 'frontend', 'dist');
const publicDir = path.join(root, 'backend', 'public');

if (!fs.existsSync(distDir)) {
  console.error('frontend/dist not found. Run "npm --prefix frontend run build" first.');
  process.exit(1);
}

// Copy the built frontend into backend/public so a single deployable directory
// (the repo root) contains both the API and the static SPA. "public" is used
// instead of "dist" because deploy platforms skip build-output directories.
fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.cpSync(distDir, publicDir, { recursive: true });

const files = fs.readdirSync(publicDir);
console.log(`Copied frontend build to backend/public (${files.length} entries):`, files.join(', '));
