# Semantic choice

## Purpose

Select one supplied eligible ID or abstain, without acquiring authority to act.

## Ownership

`decision.ts` owns bounded input and consumer result validation; `route.ts` asks
one ordinary Agent. Applications own candidates, exact routes and consequences.

## Local Contracts

No fallback, retry, discovery, installation, credentials or candidate dispatch.
Validate the complete result and membership; suitable descriptions and model
judgment remain uncertain. An empty set abstains without a call; a singleton
still needs an applicability judgment. Root cancellation remains fatal.

## Work Guidance

Use public dependencies and keep package evidence and limitations visible.

## Verification

`bun test packages/semantic-router/test` and `just check` at collection root.
Controlled responses establish boundary behavior, not semantic reliability.

## Child DOX Index

None.
