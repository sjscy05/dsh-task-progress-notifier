# dsh-task-progress-notifier

A DeepSeek Harness plugin that tracks the agent's `todo_write` task list and pops a native desktop reminder in the bottom-right corner whenever a task completes.

## What it does

- Listens to the durable `todo/write` session event and keeps the latest whole-list snapshot per session.
- Diffs each write against the previous snapshot, so it announces real transitions rather than every re-write:
  - `notifyOnComplete` — a reminder when a task moves to `completed`.
  - `notifyOnStart` — a reminder when a task moves to `in_progress` (off by default).
  - `notifyOnAllDone` — a summary reminder once every task is `completed`.
- Registers a `notify` tool so the model can raise an on-demand reminder (`Use the notify tool to remind me to take a break.`).
- Notifications are cross-platform:
  - Windows: PowerShell tray balloon tip (bottom-right).
  - macOS: `osascript` notification.
  - Linux: `notify-send`.

## Install

From a machine with `dsh` installed:

```sh
dsh plugin --profile <name> add github:sjscy05/dsh-task-progress-notifier
```

(`<name>` is the profile you want the plugin in.)

Or install straight from a checkout:

```sh
dsh plugin --profile <name> add ./task-progress-notifier
```

## Configure

The bundle ships sensible defaults. Override them in your profile's `cordis.patch.yml`:

```yaml
- id: task-progress-notifier
  config:
    title: 'DeepSeek Harness'  # popup title
    notifyOnComplete: true     # reminder per completed task
    notifyOnStart: false       # reminder per started task
    notifyOnAllDone: true      # summary reminder when everything is done
```

## Requirements

Runs on Node 22.19+ / 24+ inside a `dsh` profile. Its only imports are `@deepseek-ai/dsh-tools` and `@deepseek-ai/schemastery`, which every `dsh` installation provides through the profile's module fallback — no extra dependencies to install.

## Files

- `index.js` — the plugin (`name`, `inject`, `Config`, `apply`, the `notify` tool).
- `notify.js` — the platform-native notification dispatcher.
- `cordis.patch.yml` — the bundle patch that inserts the plugin row.
