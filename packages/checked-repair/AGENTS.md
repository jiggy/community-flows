# Checked repair

## Purpose

Turn a captured issue into bounded source replacements with independent checks
of collected behavior. A passing proposal remains material for human review.

## Ownership

`policy.ts` owns text/path/proposal bounds; `repair.ts` owns reproduction and at
most two proposals; `evidence.ts` owns fixed acceptance. The complete package
owns its contracts and public dependencies; tests own synthetic collaborators.

## Local Contracts

Only selected existing source files can change. Acceptance and original input
stay fixed. `tests` and `cli` are reviewed command slots; `agent` is an ordinary
Agent slot. No installation, credentials, network or live original writes.
Progress is optional and not acceptance. Cancellation and uncertain command work
do not authorize correction. Keep unsuccessful proposals and identity evidence.

## Work Guidance

The package is independent of the originating example; do not import it.
Maintain source provenance and package-specific limits in `EVIDENCE.md`.

## Verification

`bun test packages/checked-repair/test` and `just check` at collection root.
Controlled observations do not prove containment or command execution.

## Child DOX Index

None.
