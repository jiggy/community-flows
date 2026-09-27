# Produce a checked repair proposal

Give this method one issue, original project text, selected edit paths and fixed
CLI cases. It reproduces the defect, asks your Agent for replacement text, then
checks collected command output outside candidate execution. It returns the
original/candidate identities, proposals, actual supplied command evidence and
acceptance decisions. It does not apply, merge or publish a patch.

## Use in a project

This source package is not published on npm. Put the complete directory in your
Bun workspace (for example `methods/checked-repair`), list it as a workspace
member and declare `"@jigging/checked-repair-flow": "workspace:*"` in your Jig
application. Its own public dependencies are already declared. Run `bun install`
at your workspace root. Alternatively install a locally packed archive normally.
No build or install hook is needed for this TypeScript Flow.

Configure an ordinary Agent through the [Agent guide](https://jig.md/guide/agents).
Your application supplies the files as bounded data, not live filesystem paths.
Declare `"uses": { "repair": {} }` in the caller's `FLOW.meta.json` and bind that
slot to `binding:repair`. The repair Binding is ordinary project configuration:

```ts
import { defineBinding } from '@jigging/jig'

export default defineBinding({
  package: 'npm:@jigging/checked-repair-flow',
  settings: { maxProposals: 1 },
  slots: {
    agent: 'binding:agent',
    tests: { kind: 'command', test: ['test/project.test.ts'] },
    cli: { kind: 'command', run: 'src/cli.ts' },
  },
})
```

Review source and the exact command/Agent grants with Jig before execution. A
collection name, package name or copied contract confers no authority. Another
FLOW host must independently support the required Agent Run and Project Command
contracts; this collection does not implement a host or grant those powers.

Call the existing slot with:

```ts
const result = await run.call({
  operationId: 'repair', slot: 'repair',
  input: {
    issue: 'Return the correct total.',
    files: originalTextFiles,
    editPaths: ['src/total.ts'],
    cases: [{ id: 'total', args: [], stdin: '2\n3\n',
      stdout: '5\n', stderr: '', exitCode: 0 }],
  },
})
```

`maxProposals: 1` allows one proposal; `2` allows one correction after observed
invalid output or a check mismatch. Unknown/failed command work is not retried.
Both settings keep the same acceptance. `done` requires baseline reproduction,
a successful repository command and every independent case. `blocked` retains
unsuccessful work; `limit` retains the Agent limit. SDK failures throw and can
carry settled evidence in their details. Root cancellation remains unsuccessful.
`details.operationDetails` preserves any details supplied by the failed
collaborator alongside the method's attempts. Missing evidence is not invented.

The optional `progress` sender emits bounded phases, not test verdicts. A parent
chooses whether to connect it. Progress failure need not stop useful repair work.
The root application owns file capture, patch export, checkpoints and human
review. Keep original files and acceptance cases unchanged; inspect returned
identities and evidence before describing any proposal as ready.

## Optional library use

The same method is exported as
`import { repair } from '@jigging/checked-repair-flow/repair'`.
`repair(run)` takes the ordinary Run context: `input`, `signal`, `call`,
`channels`, and optional `settings`. It returns the same `{ outcome, output }`.
`/policy` exports input/proposal validation, candidate construction, canonical
`digest(value)` and UTF-8 `sha256(text)`; `/evidence` exports acceptance validation.

An in-process test can supply controlled `call` replies, as the package tests do.
Command replies must match the full Project Command contract in `contracts/`,
including candidate/input identities and settled termination. Synthetic records
check method behavior only: hashes do not establish that commands executed or
were contained. Using these library functions grants no host authority. Use the
ordinary admitted Flow path above for actual Agent and command execution.

## Bounds and limitations

One issue, 1–16 text files totaling 64 KiB, 1–8 existing editable `src/*.ts` or
`src/*.js` files, and 1–8 fixed CLI cases. No binary files, installations,
arbitrary shell, new files or general toolchains. The method expects Bun command
evidence. Repository tests can be influenced by candidate code; independent
acceptance compares captured behavior without importing candidate code or trusting
its pass flag. A malicious program can still hard-code the finite cases.

See [maintainers](MAINTAINERS.md), [evidence](EVIDENCE.md) and [MPL-2.0](LICENSE).
Collection membership confers neither privileged trust nor a maturity guarantee.
