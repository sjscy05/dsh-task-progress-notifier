/**
 * Task progress tracker with desktop reminders.
 *
 * Watches the durable `todo/write` session event (written by the `todo_write`
 * tool) and diffs each snapshot against the previous one. When a task moves to
 * `completed` (or `in_progress`, when enabled) it pops a native notification in
 * the bottom-right corner of the screen. It also registers a `notify` tool so
 * the model can raise an on-demand reminder.
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'
import { notify } from './notify.js'

export const name = 'task-progress-notifier'
export const inject = ['tools']

/** Deployment-tunable notification policy (Schemastery schema with defaults). */
export const Config = Schema.object({
  notifyOnComplete: Schema.boolean().default(true),
  notifyOnStart: Schema.boolean().default(false),
  notifyOnAllDone: Schema.boolean().default(true),
  title: Schema.string().default('DeepSeek Harness'),
})

/** Count a whole todo list by status. */
function countStatus(todos) {
  let pending = 0
  let inProgress = 0
  let completed = 0
  for (const todo of todos) {
    if (todo.status === 'pending') pending += 1
    else if (todo.status === 'in_progress') inProgress += 1
    else completed += 1
  }
  return { pending, inProgress, completed }
}

/** Human-readable `done/total` progress line for a todo list. */
function progressLine(todos) {
  const { completed } = countStatus(todos)
  return `${completed}/${todos.length} 已完成`
}

/**
 * Register the progress tracker and the manual `notify` tool.
 * @param {import('@deepseek-ai/cordis').Context} ctx - registrant context.
 * @param {object} config - validated notification policy.
 */
export function apply(ctx, config) {
  // Last-seen whole-list snapshot per session, so transitions are detected
  // against the same owning agent rather than across unrelated sessions.
  const previous = new Map()
  console.log('[task-progress-notifier] loaded — watching todo_write for desktop reminders')

  ctx.on('session/event', (session, event) => {
    if (event.type !== 'todo/write') return

    const todos = event.data.todos
    const key = String(session.id)
    const before = previous.get(key)
    previous.set(key, todos)

    const { completed, inProgress, pending } = countStatus(todos)
    console.log(
      `[task-progress-notifier] ${key}: ${completed}/${todos.length} 已完成, ${inProgress} 进行中, ${pending} 待处理`,
    )

    // The first write is the initial plan: record it, but do not announce its
    // already-completed entries as fresh transitions.
    if (!before) return

    const statusBefore = new Map(before.map(todo => [todo.content, todo.status]))
    const newlyCompleted = todos.filter(todo =>
      todo.status === 'completed' && statusBefore.get(todo.content) !== 'completed')
    const newlyStarted = todos.filter(todo =>
      todo.status === 'in_progress' && statusBefore.get(todo.content) !== 'in_progress')

    if (config.notifyOnComplete && newlyCompleted.length > 0) {
      notify(config.title, `✅ 完成任务：${newlyCompleted.map(todo => todo.content).join('、')}\n进度 ${progressLine(todos)}`)
    }
    if (config.notifyOnStart && newlyStarted.length > 0) {
      notify(config.title, `▶ 开始任务：${newlyStarted.map(todo => todo.content).join('、')}\n进度 ${progressLine(todos)}`)
    }
    if (config.notifyOnAllDone && todos.length > 0 && completed === todos.length) {
      notify(config.title, `🎉 全部任务完成（${completed}/${todos.length}）`)
    }
  })

  ctx.tools.register(defineTool({
    name: 'notify',
    description: 'Pop a native desktop reminder in the bottom-right corner with the given message.',
    parameters: {
      message: {
        type: 'string',
        required: true,
        description: 'The reminder text to show in the popup.',
      },
      title: {
        type: 'string',
        description: 'Optional reminder title; defaults to the configured notification title.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          dispatched: { type: 'boolean', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.dispatched ? '桌面提醒已发送（右下角弹窗）。' : '桌面提醒发送失败。',
      }],
    },
    async execute(args) {
      notify(args.title ?? config.title, args.message)
      return { dispatched: true }
    },
    presentCall: args => ({ card: 'generic', title: 'Notify', kind: 'other', rawInput: args.message }),
  }))
}
