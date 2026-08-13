/**
 * Cross-platform desktop notification dispatcher.
 *
 * Fire-and-forget: each call launches the platform's native notifier in a
 * detached child process and never throws back to the caller. A notification
 * that cannot be shown is reported to stderr, never to the agent loop.
 */

import { spawn } from 'node:child_process'

/** Collapse line breaks so every backend gets a single, well-formed body. */
function singleLine(value) {
  return value.replace(/\r?\n/g, ' ').trim()
}

/** Quote a value as a PowerShell single-quoted literal (single quotes double). */
function psLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`
}

/** Quote a value as an AppleScript double-quoted literal. */
function appleScriptLiteral(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/**
 * The PowerShell script that shows a tray balloon tip in the bottom-right
 * corner. It runs a real WinForms message loop for six seconds so the balloon
 * actually renders, then disposes the icon and exits.
 */
const WINDOWS_BALLOON_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  'Add-Type -AssemblyName System.Windows.Forms',
  'Add-Type -AssemblyName System.Drawing',
  '$n = New-Object System.Windows.Forms.NotifyIcon',
  '$n.Icon = [System.Drawing.SystemIcons]::Information',
  '$n.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info',
  '$n.BalloonTipTitle = {title}',
  '$n.BalloonTipText = {message}',
  '$n.Visible = $true',
  '$n.ShowBalloonTip(5000)',
  '$timer = New-Object System.Windows.Forms.Timer',
  '$timer.Interval = 6000',
  '$timer.add_Tick({',
  '  $timer.Stop()',
  '  $n.Dispose()',
  '  [System.Windows.Forms.Application]::Exit()',
  '})',
  '$timer.Start()',
  '[System.Windows.Forms.Application]::Run()',
].join('; ')

/**
 * Launch one native notification command. Best-effort: spawn failures are
 * logged and swallowed, so a missing notifier never breaks the harness.
 * @param {string} title - notification title.
 * @param {string} message - notification body.
 */
export function notify(title, message) {
  const body = singleLine(message)
  try {
    let child
    if (process.platform === 'win32') {
      const script = WINDOWS_BALLOON_SCRIPT
        .replace('{title}', psLiteral(singleLine(title)))
        .replace('{message}', psLiteral(body))
      child = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-STA',
        '-Command',
        script,
      ], { stdio: 'ignore', windowsHide: true })
    } else if (process.platform === 'darwin') {
      child = spawn('osascript', [
        '-e',
        `display notification ${appleScriptLiteral(body)} with title ${appleScriptLiteral(singleLine(title))}`,
      ], { stdio: 'ignore' })
    } else {
      child = spawn('notify-send', [singleLine(title), body], { stdio: 'ignore' })
    }
    child.on('error', error => {
      console.error(`[task-progress-notifier] notification failed: ${String(error)}`)
    })
    child.unref()
  } catch (error) {
    console.error(`[task-progress-notifier] notification failed: ${String(error)}`)
  }
}
