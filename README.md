# Community Flows

Reusable FLOW packages, open to community contributions and initially maintained
by Jig's founder and collaborators.

Build on an existing method instead of rebuilding its procedure. Each package
includes readable source, offline contracts, ordinary dependencies and its own
maintainers, evidence and limitations. Collection membership confers neither
privileged trust nor a maturity guarantee. Review what you install and the
authority you grant; model output still needs application checks.

| Package | Useful work | Status |
| --- | --- | --- |
| [Checked repair](packages/checked-repair/) | Propose bounded source replacements and check captured command behavior against fixed cases. | Provisional Bun-project method; controlled tests, not general coding reliability. |
| [Semantic router](packages/semantic-router/) | Choose a supplied eligible ID or abstain. | Provisional semantic judgment; never permission or dispatch authority. |

These source packages are not published to npm. Copy a complete package into
your own workspace or install a locally packed archive. Package READMEs show
ordinary Jig wiring; the methods use public FLOW interfaces, not host-private
imports. Another host must independently support their required contracts.
Jig's teaching examples remain complete projects, not consumers of this repository.

## Develop

```sh
bun install --ignore-scripts
just check
```

To make an archive, first create a destination, then:

```sh
just pack checked-repair /absolute/path/to/artifacts
```

No install/build hooks, registry publication or privileged collection loader.
See [contributing](CONTRIBUTING.md) and each package's `MAINTAINERS.md` and
`EVIDENCE.md`. Original source and documentation here use [MPL-2.0](LICENSE).
Public dependencies retain their own licenses.
