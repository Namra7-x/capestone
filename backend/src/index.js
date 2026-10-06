import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { testConnection } from './config/database.js';
import { runMigration } from './db/migrate.js';
import authRoutes from './routes/auth.js';
import todoRoutes from './routes/todos.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '100kb' }));

const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/todos', authLimiter, todoRoutes);

// API 404 (JSON) — only for /api routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Serve the built React frontend (single-origin deploy).
// The build output lives in backend/public (produced by the
// postinstall script or `npm run build:prod`). SPA fallback:
// any non-API GET route returns index.html so client-side
// routing works on refresh.
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use(errorHandler);

async function start() {
  try {
    await testConnection();
    console.log('Database connection established');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  // Ensure the schema exists (idempotent). Deploy platforms do not
  // run our custom migrate script, so create tables on boot.
  try {
    await runMigration();
    console.log('Database schema ready');
  } catch (err) {
    console.error('Schema initialization failed:', err.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} (${config.nodeEnv})`);
  });
}

start();
