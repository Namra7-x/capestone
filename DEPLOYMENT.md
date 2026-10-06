# Deploying to Antideploy

Antideploy reads your source, detects the runtime/build/start commands
and env vars, provisions infrastructure, builds a container, and
releases it behind HTTPS at `https://your-app.antideploy.com`.

## What you upload

**The whole project folder** (frontend + backend together) — not
separate pieces. The repository root is the deployable app:

- `package.json` (root) is the app manifest: it lists every
  dependency and defines `start` → `node backend/src/index.js`.
- A `postinstall` script automatically builds the React frontend
  into `backend/public/` when Antideploy runs `npm install`.
- The Express server then serves **both** the API (`/api/*`) and
  the built SPA (any other route) from one origin.

## Important platform constraints

- **One application per API key.** Create an app at antideploy.com,
  then create an API key for it. The key *is* the app.
- **Postgres only.** Antideploy does **not** provision MySQL/TiDB.
  We bring our own **TiDB Cloud** database and pass its connection
  string via the `DATABASE_URL` environment variable.
- **The whole directory is uploaded.** `node_modules`, `.git`,
  `.env`, and build-output folders (`dist`, `build`, …) are skipped
  automatically.
- **Ephemeral filesystem.** Anything written to local disk is lost
  on the next deploy. This app writes nothing to disk, so it is
  unaffected.

## Step-by-step (simplest way)

### 1. Create the app and API key
1. Sign up at **https://antideploy.com**
2. Create a new application
3. Create an **API key** for it (copy it — it is shown once)

### 2. (Recommended) Pre-build the frontend locally

From the repository root:

```bash
npm run install:all     # install frontend + backend dependencies
npm run build:prod      # build frontend into backend/public
```

This pre-populates `backend/public/` as a fallback. Even if you
skip this, the `postinstall` script rebuilds it during deploy.

### 3. Upload the whole folder

**Option A — dashboard folder upload (simplest):**
Drag the **entire project folder** into the Antideploy dashboard
deployer.

**Option B — from your coding agent (MCP):**

```bash
claude mcp add antideploy -e ANTIDEPLOY_API_KEY=ad_your_key -- npx -y antideploy-mcp
```

Then ask the agent: *"Deploy this project folder to my Antideploy
app."* The `deploy` tool returns a `taskId`; poll
`deployment_status` until it reports `succeeded`.

**Option C — from GitHub:**
Push to GitHub and connect the repository in the Antideploy
dashboard.

### 4. Set environment variables

In the Antideploy dashboard (or via the MCP `set_env` tool), set:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your TiDB Cloud MySQL string, e.g. `mysql://user:pass@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test` |
| `JWT_SECRET` | A long random string (generate one: `openssl rand -base64 48`) |
| `CLIENT_URL` | `https://your-app.antideploy.com` |
| `NODE_ENV` | `production` |

Optional: `JWT_EXPIRES_IN` (default `7d`), `BCRYPT_SALT_ROUNDS`
(default `12`), `RATE_LIMIT_MAX` (default `100`),
`RATE_LIMIT_WINDOW_MS` (default `900000`).

> **Note:** Antideploy may try to provision a Postgres database and
> inject its own `DATABASE_URL`. Because this app uses MySQL (TiDB
> Cloud), explicitly set `DATABASE_URL` to your TiDB Cloud string so
> it overrides any auto-provisioned Postgres URL.

### 5. Done

On deploy, Antideploy runs:
1. `npm install` — installs dependencies and triggers `postinstall`,
   which builds the React frontend into `backend/public/`.
2. `npm start` — starts the Express server, which connects to TiDB
   Cloud, creates the `users` and `todos` tables if they do not
   exist, and serves the API + frontend.

Open **https://your-app.antideploy.com** — register, log in, and
use the app.

## Redeploying after changes

1. Make your code changes
2. `npm run build:prod` (optional — postinstall rebuilds anyway)
3. Upload the whole folder (or push to GitHub) again

## Rollback

Antideploy keeps previously built images. Use the dashboard (or the
platform's rollback feature) to roll back to an earlier build in
~40 seconds.
