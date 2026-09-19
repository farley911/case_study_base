import { spawnSync } from 'node:child_process'

const MAX_REPAIR_ATTEMPTS = 3
const DEFAULT_GATE_TIMEOUT_MS = 180_000
const E2E_GATE_TIMEOUT_MS = 300_000

// After three failed repair attempts, Cursor gets one final turn
// whose only purpose is to report the failure debrief.
const ALLOW_DEBRIEF_EXIT_AT_LOOP = MAX_REPAIR_ATTEMPTS + 1

let rawInput = ''

for await (const chunk of process.stdin) {
  rawInput += chunk
}

let input

try {
  input = JSON.parse(rawInput)
} catch {
  // Invalid hook input should fail closed via the non-zero exit.
  process.exit(1)
}

// Don't interfere with aborted/error agent sessions.
if (input.status !== 'completed') {
  respond({})
}

// After the final failure we ask the agent for a debrief.
// That debrief itself triggers the stop hook again.
//
// At that point allow the response through without rerunning
// the gates or starting another repair loop.
// The debrief itself triggers this stop hook again.
// Allow that final response to exit even though the gates are still red.
if (input.loop_count >= ALLOW_DEBRIEF_EXIT_AT_LOOP) {
  respond({})
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const gates = [
  {
    name: 'Typecheck',
    command: npm,
    args: ['run', 'typecheck'],
    displayCommand: 'npm run typecheck',
  },
  {
    name: 'ESLint',
    command: npm,
    args: ['run', 'lint'],
    displayCommand: 'npm run lint',
  },
  {
    name: 'Stylelint',
    command: npm,
    args: ['run', 'lint:styles'],
    displayCommand: 'npm run lint:styles',
  },
  {
    name: 'Tests',
    command: npm,
    args: ['run', 'test:coverage', '--', '--runInBand'],
    displayCommand: 'npm run test:coverage -- --runInBand',
  },
  {
    name: 'Quality Ratchet',
    command: npm,
    args: ['run', 'betterer:ci'],
    displayCommand: 'npm run betterer:ci',
  },
  {
    name: 'Build',
    command: npm,
    args: ['run', 'build'],
    displayCommand: 'npm run build',
  },
  {
    name: 'E2E',
    command: npm,
    args: ['run', 'test:e2e'],
    displayCommand: 'npm run test:e2e',
    timeout: E2E_GATE_TIMEOUT_MS,
  },
]

const results = gates.map(runGate)

const failures = results.filter((result) => !result.passed)

if (failures.length === 0) {
  respond({})
}

const summary = results
  .map((result) => {
    const status = result.passed ? 'PASS' : 'FAIL'
    return `- ${result.displayCommand} — ${status} (${result.durationMs}ms)`
  })
  .join('\n')

const failureDetails = failures
  .map((failure) => {
    const output = tail(failure.output, 6000)

    return [
      `## ${failure.name} failure`,
      `Command: ${failure.displayCommand}`,
      `Exit code: ${failure.exitCode ?? 'unknown'}`,
      '',
      '```text',
      output || '(no output)',
      '```',
    ].join('\n')
  })
  .join('\n\n')

const repairNumber = input.loop_count + 1

if (repairNumber <= MAX_REPAIR_ATTEMPTS) {
  respond({
    followup_message: [
      `QUALITY GATE FAILURE — repair attempt ${repairNumber}/${MAX_REPAIR_ATTEMPTS}.`,
      '',
      'You attempted to mark the task complete, but the required quality gates are not green.',
      '',
      summary,
      '',
      failureDetails,
      '',
      'Requirements:',
      '1. Investigate the failures above.',
      '2. Fix the underlying problem.',
      '3. Do not weaken, skip, disable, or remove tests, lint rules, type checks, or build checks merely to obtain a green run.',
      '4. Do not claim the task is complete yet.',
      '5. After making the fixes, attempt completion again. The stop hook will rerun all quality gates.',
    ].join('\n'),
  })
}

// Three repair attempts have already occurred.
// Give the agent one final turn whose sole purpose is explaining
// what remains broken to the user.
respond({
  followup_message: [
    'QUALITY GATE FAILURE — repair limit reached.',
    '',
    `The task has failed its quality gates after ${MAX_REPAIR_ATTEMPTS} repair attempts.`,
    '',
    summary,
    '',
    failureDetails,
    '',
    'Do NOT make additional code changes during this turn.',
    'Do NOT claim that the task is complete.',
    '',
    'Give the user a concise debrief containing:',
    '- which quality gates are still failing,',
    '- the specific errors or symptoms,',
    '- what you attempted to fix,',
    '- your best assessment of the root cause,',
    '- what remains unresolved,',
    '- the next action you recommend.',
    '',
    'Clearly state that the task is not verified complete.',
  ].join('\n'),
})

function runGate(gate) {
  const start = Date.now()

  const result = spawnSync(gate.command, gate.args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: 'true',
      FORCE_COLOR: '0',
    },
    timeout: gate.timeout ?? DEFAULT_GATE_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  })

  const durationMs = Date.now() - start

  const output = [
    result.stdout,
    result.stderr,
    result.error?.message,
    result.signal ? `Process terminated by signal: ${result.signal}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .trim()

  return {
    name: gate.name,
    displayCommand: gate.displayCommand,
    passed: result.status === 0,
    exitCode: result.status,
    durationMs,
    output,
  }
}

function tail(value, maxLength) {
  if (!value) {
    return ''
  }

  if (value.length <= maxLength) {
    return value
  }

  return `[output truncated — showing final ${maxLength} characters]\n${value.slice(
    -maxLength,
  )}`
}

function respond(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}
