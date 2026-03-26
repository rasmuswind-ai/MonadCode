# Monad Code

Lightweight PowerShell script scheduler with a web UI. A minimal alternative to PowerShell Universal for running `.ps1` scripts on a schedule.

## Features

- Register local `.ps1` scripts
- Define cron-based schedules with enable/disable toggle
- Run scripts on-demand from the UI
- View execution history with stdout/stderr output
- Dashboard with 24h stats
- Runs as a Windows Service
- Localhost-only web interface (port 5088)

## Quick Start

```bash
# Start the server directly
node server.js

# Open in browser
start http://127.0.0.1:5088
```

## Install Monad Code

Download the exe file from the repo.
Run your desired teminal as Administrator:

```bash
.\monadcode.exe install
```

To remove the Monad Code:

```bash
.\monadcode.exe uninstall
```

## Configuration

Set the port via environment variable:

```bash
set MONADCODE_PORT=8080
node server.js
```

## Cron Expression Examples

| Expression      | Description              |
|-----------------|--------------------------|
| `*/5 * * * *`   | Every 5 minutes          |
| `0 * * * *`     | Every hour               |
| `0 9 * * *`     | Daily at 9:00 AM         |
| `0 9 * * 1-5`   | Weekdays at 9:00 AM      |
| `0 0 * * 0`     | Weekly on Sunday midnight |
| `0 0 1 * *`     | First day of each month   |

## Development

To modify the frontend:

```bash
cd frontend
npm install
npm run dev    # Dev server with hot reload (proxies API to :5088)
npm run build  # Build to ../wwwroot
```

## Project Structure

```
MonadCode/
  server.js              # Express server + app entry point
  lib/
    api.js               # REST API routes
    db.js                # JSON file database
    scheduler.js         # Cron scheduler + PowerShell runner
  data/
    monadcode.json       # Database (auto-created)
  scripts/
    hello.ps1            # Sample script
  wwwroot/               # Built frontend (served by Express)
  frontend/              # React/TypeScript source
  service-install.js     # Windows Service installer
  service-uninstall.js   # Windows Service uninstaller
```
