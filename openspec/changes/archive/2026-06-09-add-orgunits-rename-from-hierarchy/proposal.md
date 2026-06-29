## Why

In the DHIS2 Android Capture app, the org unit tree and search show only each org unit's display name, so leaf org units that share the same name (e.g. several "Mental Health" units under different facilities) are indistinguishable to users. There is no app- or settings-level fix, so the names themselves must be disambiguated by adding the parent org unit's name as prefix or suffix.

## What Changes

```sh
yarn start \
  orgunits rename-from-hierarchy \
  --root-orgunit-ids=ID1,ID2 \
  --parent-name-as=prefix|suffix \
  --post
```

-   Add a new `rename-from-hierarchy` subcommand to the existing `orgunits` command.
-   Given one or more root org unit IDs (at any hierarchy level), the command finds their leaf (last-level) descendants and renames each by combining the leaf name with its **parent** org unit's name, separated by `" - "`.
-   A `--parent-name-as=prefix|suffix` option controls whether the parent name is prepended or appended (e.g. `Mental Health - Gaza Secondary Healthcare` for `suffix`).
-   A `--post` flag applies the renames via the DHIS2 API; without it, the command runs as a dry run that previews the changes.
-   The new name is recomputed every run: the leaf's existing affix segment (the part on the other side of the `" - "` separator) is stripped to recover the base name, then the **current** parent name is re-applied. A leaf is written only when the recomputed name differs from its current name.
    -   This makes re-runs idempotent: with an unchanged parent the recomputed name equals the current one, so nothing is written (no double-append).
    -   It also propagates parent renames systemically: an already-renamed `Mental Health - Gaza Secondary Healthcare`, whose parent was renamed to `Gaza Secondary Healthcare Center`, is rewritten to `Mental Health - Gaza Secondary Healthcare Center`.
