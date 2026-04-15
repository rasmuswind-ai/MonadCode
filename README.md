# Monad Code

Lightweight PowerShell script scheduler with a web UI. A minimal alternative to PowerShell Universal for running `.ps1` scripts on a schedule.

## Features

- Register local `.ps1` scripts
- VS Code-style folder explorer for organizing scripts
- Define cron-based schedules with enable/disable toggle
- Run scripts on-demand from the UI
- View execution history with search and status filtering
- Dashboard with 42h stats
- Runs as a Windows Service
- Localhost-only web interface (port 5088)

## Installation

1. Download the `.msi` installer from the repository
2. Run the installer — if Windows Smart App Control blocks it, right-click the `.msi`, go to **Properties**, and check **Unblock**, then try again
3. The service starts automatically after installation
4. Open your browser to [http://127.0.0.1:5088](http://127.0.0.1:5088)

## Getting Started

### 1. Set up your scripts folder

When you first open the **Scripts** page, you'll be prompted to choose a root folder where your PowerShell scripts are located. This can be any folder on any drive (C:\, D:\, E:\, etc.).

The folder structure will appear as a navigable tree in the left sidebar, similar to VS Code's file explorer.

### 2. Add a script

1. Navigate to a folder in the explorer sidebar
2. Click **+ Add Script** in the top right
3. Enter a name and the script filename (the folder path is filled in automatically based on your current location in the explorer)
4. Optionally add a description and adjust the timeout
5. Click **Add Script**

### 3. Create a schedule

1. Go to the **Schedules** page
2. Click **+ Create Schedule**
3. Enter a schedule name
4. Search and select a registered script from the dropdown
5. Configure the schedule frequency (every N minutes, hourly, daily, weekly, or custom cron)
6. Click **Create Schedule**

### 4. Monitor executions

Go to the **History** page to see all script executions. You can:
- Search by script name
- Filter by status (success, failed, running)
- Click the terminal icon to view stdout/stderr output

## Configuration

Set the port via environment variable:

```bash
set MONADCODE_PORT=8080
```

Default port is `5088`.

## Cron Expression Examples

| Expression      | Description              |
|-----------------|--------------------------|
| `*/5 * * * *`   | Every 5 minutes          |
| `0 * * * *`     | Every hour               |
| `0 9 * * *`     | Daily at 9:00 AM         |
| `0 9 * * 1-5`   | Weekdays at 9:00 AM      |
| `0 0 * * 0`     | Weekly on Sunday midnight |
| `0 0 1 * *`     | First day of each month   |

## Project Structure

```
MonadCode/
  server.js              # Express server + app entry point
  lib/
    api.js               # REST API routes
    db.js                # JSON file database
    scheduler.js         # Cron scheduler + PowerShell runner
    paths.js             # Path resolution helpers
  data/
    monadcode.json       # Database (auto-created)
  wwwroot/               # Built frontend (served by Express)
  frontend/              # React/TypeScript source
    src/
      pages/             # Scripts, Schedules, History, Home
      components/        # Modal, FolderTree, FileBrowser, StatusBadge
      api.ts             # Frontend API client
      types.ts           # TypeScript interfaces
  service-install.js     # Windows Service installer
  service-uninstall.js   # Windows Service uninstaller
```
