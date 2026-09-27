import { expect, test } from 'bun:test'
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const collection = resolve(import.meta.dir, '..')

test('complete packed methods install and expose their public contracts outside the collection', async () => {
  const root = await mkdtemp(join(tmpdir(), 'community-flows-consumer-'))
  const artifacts = join(root, 'artifacts')
  const consumer = join(root, 'consumer')
  await mkdir(artifacts)
  await mkdir(consumer)
  async function command(args: string[], cwd: string) {
    const child = Bun.spawn(args, {
      cwd,
      env: {
        PATH: process.env.PATH ?? '',
        BUN_INSTALL_CACHE_DIR: join(root, 'cache'),
      },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const timer = setTimeout(() => child.kill('SIGKILL'), 25000)
    try {
      const [code, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])
      expect(code, (stdout + stderr).slice(0, 8192)).toBe(0)
      return stdout
    } finally {
      clearTimeout(timer)
    }
  }
  try {
    for (const name of ['checked-repair', 'semantic-router'])
      await command(
        [process.execPath, 'pm', 'pack', '--ignore-scripts', '--destination', artifacts],
        join(collection, 'packages', name),
      )
    const archives = (await readdir(artifacts)).filter((name) => name.endsWith('.tgz'))
    expect(archives).toHaveLength(2)
    const dependencies = Object.fromEntries(
      archives.map((name) => [
        name.includes('checked-repair')
          ? '@jigging/checked-repair-flow'
          : '@jigging/semantic-router-flow',
        `file:${join(artifacts, name)}`,
      ]),
    )
    await writeFile(
      join(consumer, 'package.json'),
      JSON.stringify({ private: true, type: 'module', dependencies }),
    )
    await command([process.execPath, '--no-env-file', 'install', '--ignore-scripts'], consumer)
    await writeFile(
      join(consumer, 'check.ts'),
      `
      import { parseInput, digest } from '@jigging/checked-repair-flow/policy'
      import { repair } from '@jigging/checked-repair-flow/repair'
      import { evaluate } from '@jigging/checked-repair-flow/evidence'
      import { routingInput, checkRoutingResult } from '@jigging/semantic-router-flow/decision'
      import { route } from '@jigging/semantic-router-flow/route'
      if ([parseInput, digest, repair, evaluate, routingInput, checkRoutingResult, route].some(v => typeof v !== 'function')) throw new Error('Missing public export')
      for (const task of ['Summarize an incident', 'Classify an invoice']) {
        const result = await route({ input: { task, candidates: [] }, signal: new AbortController().signal,
          call: async () => { throw new Error('Empty set must not call an Agent') } })
        if (result.outcome !== 'done' || result.output.candidateId !== null) throw new Error('Invalid abstention')
      }
      console.log('ordinary packed consumer passed')
    `,
    )
    expect(
      await command([process.execPath, '--no-env-file', '--no-install', 'check.ts'], consumer),
    ).toContain('ordinary packed consumer passed')
    for (const name of ['checked-repair', 'semantic-router']) {
      const packageRoot = join(consumer, 'node_modules/@jigging', `${name}-flow`)
      const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
      expect(manifest.scripts).toBeUndefined()
      for (const entry of [
        'FLOW.ts',
        'FLOW.meta.json',
        'FLOW.contract.json',
        'LICENSE',
        'MAINTAINERS.md',
        'EVIDENCE.md',
      ])
        expect((await readFile(join(packageRoot, entry))).length).toBeGreaterThan(0)
      const descriptor = JSON.parse(
        await readFile(join(packageRoot, 'contracts/agent-run/contract.json'), 'utf8'),
      )
      for (const port of Object.values(descriptor.channels ?? {}) as { contract?: string }[]) {
        if (port.contract) {
          const file = resolve(packageRoot, 'contracts/agent-run', port.contract)
          expect(file.startsWith(`${packageRoot}/`)).toBe(true)
          expect(JSON.parse(await readFile(file, 'utf8')).$schema).toBeDefined()
        }
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}, 60000)
