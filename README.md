# dsh-task-progress-notifier

[English](#english) | [中文](#中文)

## English

A DeepSeek Harness plugin that tracks the agent's `todo_write` task list and pops a native desktop reminder in the bottom-right corner whenever a task completes.

### What it does

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

### Install

From a machine with `dsh` installed:

```sh
dsh plugin --profile <name> add github:sjscy05/dsh-task-progress-notifier
```

(`<name>` is the profile you want the plugin in.)

Or install straight from a checkout:

```sh
dsh plugin --profile <name> add ./task-progress-notifier
```

### Configure

The bundle ships sensible defaults. Override them in your profile's `cordis.patch.yml`:

```yaml
- id: task-progress-notifier
  config:
    title: 'DeepSeek Harness'  # popup title
    notifyOnComplete: true     # reminder per completed task
    notifyOnStart: false       # reminder per started task
    notifyOnAllDone: true      # summary reminder when everything is done
```

### Requirements

Runs on Node 22.19+ / 24+ inside a `dsh` profile. Its only imports are `@deepseek-ai/dsh-tools` and `@deepseek-ai/schemastery`, which every `dsh` installation provides through the profile's module fallback — no extra dependencies to install.

### Files

- `index.js` — the plugin (`name`, `inject`, `Config`, `apply`, the `notify` tool).
- `notify.js` — the platform-native notification dispatcher.
- `cordis.patch.yml` — the bundle patch that inserts the plugin row.

## 中文

一个 DeepSeek Harness 插件：跟踪 agent 的 `todo_write` 任务进度，并在任务完成时在电脑右下角弹出原生桌面提醒。

### 功能

- 监听持久化的 `todo/write` 会话事件，为每个会话维护最新的完整任务清单快照。
- 对每次写入与上一次快照做差分，只播报真正的状态迁移，而不是每次重写都播报：
  - `notifyOnComplete` —— 任务变为 `completed` 时弹提醒。
  - `notifyOnStart` —— 任务变为 `in_progress` 时弹提醒（默认关闭）。
  - `notifyOnAllDone` —— 全部任务完成后弹汇总提醒。
- 注册 `notify` 工具，让模型可以主动弹提醒（例如「用 notify 工具提醒我起来活动一下」）。
- 跨平台通知：
  - Windows：PowerShell 托盘气泡（右下角）。
  - macOS：`osascript` 通知。
  - Linux：`notify-send`。

### 安装

在装有 `dsh` 的机器上：

```sh
dsh plugin --profile <name> add github:sjscy05/dsh-task-progress-notifier
```

（`<name>` 是你想装进的目标 profile 名称。）

也可以从本地 checkout 直接安装：

```sh
dsh plugin --profile <name> add ./task-progress-notifier
```

### 配置

bundle 自带合理默认值。可在 profile 的 `cordis.patch.yml` 里覆盖：

```yaml
- id: task-progress-notifier
  config:
    title: 'DeepSeek Harness'  # 弹窗标题
    notifyOnComplete: true     # 每完成一个任务弹提醒
    notifyOnStart: false       # 每开始一个任务弹提醒
    notifyOnAllDone: true      # 全部完成时弹汇总提醒
```

### 环境要求

在 `dsh` profile 中运行，需要 Node 22.19+ / 24+。仅导入 `@deepseek-ai/dsh-tools` 和 `@deepseek-ai/schemastery`，这两个包每个 `dsh` 安装都会通过 profile 的模块回退目录提供——无需额外安装依赖。

### 文件

- `index.js` —— 插件本体（`name`、`inject`、`Config`、`apply`，以及 `notify` 工具）。
- `notify.js` —— 平台原生通知派发。
- `cordis.patch.yml` —— 插入插件行的 bundle patch。
