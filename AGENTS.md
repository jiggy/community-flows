# Capability compounding

## Purpose

Maintain reusable FLOW packages that people can inspect, adapt and compose on
their own terms. Collection membership grants neither privileged trust nor a
maturity guarantee. Applications and operators own consequences and authority.

## Ownership

Each package owns its implementation, offline contracts, README, maintainers,
tests, evidence and limitations. Shared tooling checks packaging, not model
correctness or host containment. Jig examples own their application wiring and
policy; composition examples may consume these packages through public dependencies.
`test/packed.test.ts` installs complete local archives into a fresh ordinary
consumer and checks exports and descriptor closures without provider calls.

## Local Contracts

- Use public dependencies and ordinary FLOW calls; no Jig private imports.
- Operators choose providers, credentials and grants. Packages receive none
  merely because they are maintained here.
- Preserve unsupported and unsuccessful outcomes. Never replay uncertain work.
- Keep package-specific maintainers, license, evidence and bounds visible.
- Changes replace provisional interfaces in place; published archive bytes are immutable.

## Work Guidance

Use explicit Just recipes, not package lifecycle scripts. Never publish or push
as part of a local test. Distinguish controlled collaborators, executed commands,
installed adoption, live model behavior and independent qualification.

## Verification

`just check` runs package tests and type checks. `just pack <package> <destination>`
packs a complete ordinary source artifact; destination must already exist.

## Child DOX Index

- [packages/checked-repair/AGENTS.md](packages/checked-repair/AGENTS.md) — Bounded checked source replacement.
- [packages/semantic-router/AGENTS.md](packages/semantic-router/AGENTS.md) — Choice within a supplied eligible set.
