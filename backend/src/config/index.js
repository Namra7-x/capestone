import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load backend/.env regardless of the current working directory, so the
// app can be started from the repository root (as on deploy platforms)
// or from backend/. On platforms that inject env vars directly (e.g.
// Antideploy), no .env file exists and dotenv safely no-ops.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // <root>/backend/src/config
const backendRoot = path.resolve(__dirname, '..', '..'); // <root>/backend
dotenv.config({ path: path.join(backendRoot, '.env') });

const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
};

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export default config;
