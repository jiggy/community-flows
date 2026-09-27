# ---------------------------------------------------------------------------- #
#                                   COMMANDS                                   #
# ---------------------------------------------------------------------------- #

@default:
    just --list

@test:
    bun test packages test --timeout 60000

@check: test
    bun node_modules/typescript/bin/tsc --noEmit -p tsconfig.json

# Pack an explicitly selected method; no lifecycle scripts or publication
[positional-arguments]
pack package destination:
    #!/bin/sh
    set -eu
    case "$1" in checked-repair|semantic-router) ;; *) printf '%s\n' 'Choose checked-repair or semantic-router.' >&2; exit 1;; esac
    test -d "$2"
    pack_destination="$2"
    case "$pack_destination" in /*) ;; *) pack_destination="$PWD/$pack_destination";; esac
    cd "packages/$1"
    bun pm pack --ignore-scripts --destination "$pack_destination"
