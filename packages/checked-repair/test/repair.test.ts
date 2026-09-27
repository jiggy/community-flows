import { expect, test } from 'bun:test'
import { OperationError, type RunContext } from '@jigging/flow'
import {
  candidate,
  digest,
  parseInput,
  parseProposal,
  type RepairInput,
  sha256,
} from '../policy.ts'
import { repair } from '../repair.ts'

// Controlled records exercise method policy, not command execution or containment.
const inputs: RepairInput[] = [
  {
    issue: 'Fix total.',
    files: { 'src/total.ts': 'export const total = 0', 'test/project.test.ts': 'fixed test' },
    editPaths: ['src/total.ts'],
    cases: [{ id: 'total', args: [], stdin: '2 3', stdout: '5\n', stderr: '', exitCode: 0 }],
  },
  {
    issue: 'Fix inventory count.',
    files: {
      'src/count.ts': 'export const count = 0',
      'test/project.test.ts': 'independent fixed test',
    },
    editPaths: ['src/count.ts'],
    cases: [
      { id: 'count', args: ['count'], stdin: 'a b c', stdout: '3\n', stderr: '', exitCode: 0 },
    ],
  },
]

async function exercise(
  input: RepairInput,
  options: {
    maxProposals?: 1 | 2
    failFirst?: boolean
    baselinePass?: boolean
    truncated?: boolean
    wrongIdentity?: boolean
    commandFailure?: string
    commandFailureDetails?: RunContext['input']
  } = {},
) {
  const original = structuredClone(input)
  let agents = 0
  const calls: string[] = []
  const run: Pick<RunContext, 'input' | 'signal' | 'call' | 'channels' | 'settings'> = {
    input: input as unknown as RunContext['input'],
    signal: new AbortController().signal,
    channels: {},
    settings: { maxProposals: options.maxProposals ?? 2 },
    async call(request) {
      calls.push(request.slot)
      if (request.slot === 'agent') {
        agents++
        return {
          outcome: 'done',
          output: {
            text: '',
            structured: {
              replacements: [
                { path: input.editPaths[0]!, content: 'export const repaired = true' },
              ],
              summary: 'Controlled replacement, not a live Agent result.',
            },
          },
        }
      }
      if (options.commandFailure && agents > 0)
        throw new OperationError(
          options.commandFailure,
          'Command stopped.',
          options.commandFailureDetails,
        )
      const data = request.input as unknown as {
        files: Record<string, string>
        stdin: string
        args: string[]
      }
      const passed =
        agents === 0 ? options.baselinePass === true : !(options.failFirst && agents === 1)
      const check = input.cases.find(
        (c) => c.stdin === data.stdin && JSON.stringify(c.args) === JSON.stringify(data.args),
      )!
      return {
        outcome: 'done',
        output: {
          candidateDigest: options.wrongIdentity ? sha256('other contents') : digest(data.files),
          stdinDigest: sha256(data.stdin),
          cleanup: 'complete',
          stopReason: 'exited',
          invocation:
            request.slot === 'tests'
              ? ['bun', 'test', 'test/project.test.ts']
              : ['bun', 'src/cli.ts', ...data.args],
          exitCode: request.slot === 'tests' ? (passed ? 0 : 1) : passed ? check.exitCode : 1,
          signal: null,
          stdout: {
            text: request.slot === 'tests' ? '' : passed ? check.stdout : 'wrong\n',
            truncated: options.truncated ?? false,
          },
          stderr: {
            text:
              request.slot === 'tests'
                ? 'controlled repository evidence'
                : passed
                  ? check.stderr
                  : '',
            truncated: false,
          },
        },
      }
    },
  }
  try {
    return { result: await repair(run), agents, calls }
  } finally {
    expect(input).toEqual(original)
  }
}

test('the unchanged method handles two unrelated callers with caller-owned acceptance', async () => {
  for (const input of inputs) {
    const { result, agents } = await exercise(input)
    expect(result.outcome).toBe('done')
    expect(agents).toBe(1)
    const output = result.output as unknown as {
      baseDigest: string
      acceptanceDigest: string
      attempts: { evaluation: { accepted: boolean } }[]
    }
    expect(output.baseDigest).toBe(digest(input.files))
    expect(output.acceptanceDigest).toBe(digest(input.cases))
    expect(output.attempts[0]?.evaluation.accepted).toBe(true)
    expect((result.output as { reason: string }).reason).toBe(
      'The proposed repair passes the repository command and independent acceptance cases.',
    )
  }
})
test('one proposal stops after failure; two allow only one evidence-driven correction', async () => {
  const single = await exercise(inputs[0]!, { maxProposals: 1, failFirst: true })
  expect(single.result.outcome).toBe('blocked')
  expect(single.agents).toBe(1)
  const corrected = await exercise(inputs[0]!, { maxProposals: 2, failFirst: true })
  expect(corrected.result.outcome).toBe('done')
  expect(corrected.agents).toBe(2)
})
test('already passing acceptance never dispatches an Agent', async () => {
  const { result, agents } = await exercise(inputs[0]!, { baselinePass: true })
  expect(result.outcome).toBe('blocked')
  expect(agents).toBe(0)
})
test('truncated evidence cannot qualify a patch and mismatched contents cannot qualify observations', async () => {
  expect((await exercise(inputs[0]!, { truncated: true })).result.outcome).toBe('blocked')
  await expect(exercise(inputs[0]!, { wrongIdentity: true })).rejects.toThrow('identity')
})
test('uncertain, cancelled and expired command work never trigger a second proposal', async () => {
  for (const code of ['UNCERTAIN', 'CANCELLED', 'DEADLINE_EXCEEDED']) {
    try {
      await exercise(inputs[0]!, { commandFailure: code })
      throw new Error('Expected failure')
    } catch (error) {
      expect(error).toBeInstanceOf(OperationError)
      const failure = error as OperationError
      expect(failure.code).toBe(code)
      const evidence = failure.details as unknown as { attempts: unknown[] }
      expect(evidence.attempts).toHaveLength(1)
    }
  }
})
test('operational failure retains collaborator details without overwriting method evidence', async () => {
  const details = {
    command: { cleanup: 'complete', stopReason: 'cancelled' },
    attempts: ['not method attempts'],
  }
  try {
    await exercise(inputs[0]!, { commandFailure: 'CANCELLED', commandFailureDetails: details })
    throw new Error('Expected failure')
  } catch (error) {
    expect(error).toBeInstanceOf(OperationError)
    const failure = error as OperationError
    expect(failure.code).toBe('CANCELLED')
    expect(failure.message).toBe('Command stopped.')
    expect(failure.details).toMatchObject({
      baseDigest: digest(inputs[0]!.files),
      operationDetails: details,
    })
    expect((failure.details as { attempts: unknown[] }).attempts).toHaveLength(1)
    expect(details.attempts).toEqual(['not method attempts'])
  }
})
test('source and proposal bounds protect acceptance files and exact existing edit paths', () => {
  const input = parseInput(inputs[0])
  for (const name of ['../outside', 'test/project.test.ts', 'src/new.ts'])
    expect(() =>
      parseProposal({ summary: 'invalid', replacements: [{ path: name, content: '' }] }, input),
    ).toThrow()
  expect(() => parseInput({ ...input, editPaths: ['../outside'] })).toThrow()
  const proposal = parseProposal(
    { summary: 'replace source', replacements: [{ path: 'src/total.ts', content: 'new source' }] },
    input,
  )
  expect(candidate(input, proposal)['test/project.test.ts']).toBe(
    input.files['test/project.test.ts'],
  )
})
test('root cancellation prevents all collaborator calls', async () => {
  const controller = new AbortController()
  controller.abort(new Error('root stop'))
  let calls = 0
  await expect(
    repair({
      input: inputs[0] as unknown as RunContext['input'],
      channels: {},
      signal: controller.signal,
      call: async () => {
        calls++
        return { outcome: 'done', output: null }
      },
    }),
  ).rejects.toThrow('root stop')
  expect(calls).toBe(0)
})
