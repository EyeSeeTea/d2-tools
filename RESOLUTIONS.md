# Dependency resolutions

This file records dependency decisions that `package.json` cannot explain on its own: why a
`resolutions` entry exists, why a direct dependency is held at an exact version, which findings are
carried because no usable fix exists, and which constraints were tried and rejected.

Add, update or remove an entry in the same change as the constraint it describes. An entry that
outlives its constraint is worse than no entry.

## How to read an entry

-   **Why** — the dependency path that needs the constraint, and why a normal upgrade does not work.
-   **Fixes** — the advisory or the compatibility problem addressed.
-   **Drop when** — the observable condition that lets you remove the entry.

Each entry also records what was **measured** when it was removed and the tree reinstalled, because
that is the only evidence it still binds.

## Conventions

-   **`^` range or exact version? Ask what the number is asserting.**

    A **floor** — _"never below this"_ — takes a `^` range. Almost every security constraint is a
    floor: it does not matter whether `axios` resolves to 1.19.0 or 1.20.0, only that it is not 1.6.4.
    Newer is strictly better, so let it land.

    A **fixture** — _"exactly this"_ — takes an exact version, because something binds to that release.
    These are compatibility constraints, not security ones.

    An exact version where a floor belonged **decays**: no patch can ever be selected, so the
    constraint eventually holds the tree _at_ the version it was added to escape. If you pin exactly,
    **write the condition for unpinning it**. If you cannot state that condition, it should have been a
    range.

-   **Measure removal, not conversion.** To test whether an entry still does anything, delete it,
    reinstall, and compare **the resolved versions** — never the lockfile bytes. A byte-identical
    lockfile proves the entry matched no descriptor, but the reverse does not hold: an entry can
    rewrite a descriptor, change the lockfile, and leave every installed version exactly where it was.

-   **An older version returning is not by itself a reason to keep an entry.** The question is whether
    the version that returns is inside an advisory range, not whether it is older.

-   Prefer **per-parent** paths (`parent/child`) when only one consumer needs constraining. A
    standalone descriptor rewrites the request of every consumer in the tree, including healthy ones.
    Every entry here is standalone because each affected package has exactly one line present in the
    tree; re-check that before adding another.

### The environment constraint behind several entries

This project targets the Node version in `.nvmrc` (Node 18), and the CI workflow pins the same major.
Several published fixes below require Node 20 or later and therefore cannot be installed here,
regardless of what the advisory says. This is a property of the packages' own `engines` fields:

```bash
npm view <package>@<version> engines
```

## Audit cadence

Re-audit the dependency tree monthly, and before every release. A resolution that has silently
stopped working shows up as a finding that keeps coming back for a package that already has an entry.

Note that `yarn audit` and Dependency-Track disagree on severity, because they score against
different advisory sources. **The CI gate follows Dependency-Track**, so measure there before
concluding the tree is clean, and never quote a before/after count that mixes the two.

---

## Resolutions

### `axios: ^1.18.0`

-   **Why:** `@eyeseetea/d2-api` declares `axios` as an exact version rather than a range, so the
    version it pins is the only one the tree can select through that path. Every published release of
    that package to date pins the same exact version, so upgrading the parent does not move `axios`
    and a resolution is the only available route.
    _Measured: removing this entry and reinstalling resolves `axios` back to 1.6.4._
-   **Fixes:** 29 advisories against the version that returns without it — GHSA-35jp-ww65-95wh,
    GHSA-3g43-6gmg-66jw, GHSA-43fc-jf86-j433, GHSA-4hjh-wcwx-xvwj, GHSA-6chq-wfr3-2hj9,
    GHSA-8hc4-vh64-cxmj, GHSA-hfxv-24rg-xrqf, GHSA-j5f8-grm9-p9fc, GHSA-jr5f-v2jv-69x6,
    GHSA-p92q-9vqr-4j8v, GHSA-pf86-5x62-jrwf, GHSA-pmwg-cvhr-8vh7, GHSA-q8qp-cvcw-x6jj (high);
    GHSA-3p68-rc4w-qgx5, GHSA-3w6x-2g7m-8v23, GHSA-42h9-826w-cgv3, GHSA-445q-vr5w-6q77,
    GHSA-5c9x-8gcm-mpgx, GHSA-62hf-57xw-28j9, GHSA-7q8q-rj6j-mhjq, GHSA-898c-q2cr-xwhg,
    GHSA-fvcv-3m26-pcqx, GHSA-m7pr-hjqh-92cm, GHSA-mmx7-hfxf-jppx, GHSA-pmv8-rq9r-6j72,
    GHSA-vf2m-468p-8v99, GHSA-w9j2-pvgh-6h63, GHSA-xx6v-rp6x-q39c (medium); GHSA-xhjh-pmcv-23jw (low).
-   **Runtime, not build-only.** `axios` is what `@eyeseetea/d2-api` uses for every DHIS2 API call, so
    this was verified by instantiating the API client and building a request, not by `yarn install`
    alone.
-   **Drop when:** `@eyeseetea/d2-api` declares `axios` as a range that admits 1.18.0 or later. Verify
    with `npm view @eyeseetea/d2-api@<version> dependencies.axios` before removing. That package is
    EyeSeeTea-owned, so fixing the declaration upstream removes this entry from every application that
    depends on it, not only this one.

### `lodash: ^4.18.0`

-   **Why:** Same cause as `axios` — `@eyeseetea/d2-api` pins `lodash` to an exact version. This
    project also depends on `lodash` directly with a range that already admits the patched release, so
    without the resolution the tree carries two copies and the pinned one stays vulnerable.
    _Measured: removing this entry and reinstalling resolves `lodash` to 4.17.21 alongside 4.18.1._
-   **Fixes:** 3 advisories against the version that returns without it — GHSA-r5fr-rjxr-66jc (high),
    code injection via `_.template`; GHSA-f23m-r3pf-42rh and GHSA-xxjr-mmjv-4gpg (medium), prototype
    pollution. 4.18.0 is the first release outside all three ranges.
-   **Runtime, not build-only.** `lodash` is a direct dependency of this project and is also reached
    through `@eyeseetea/d2-api`.
-   **Drop when:** `@eyeseetea/d2-api` declares `lodash` as a range that admits 4.18.0 or later, **and**
    removing the entry does not reintroduce an older copy. That package is EyeSeeTea-owned, so the
    declaration can be fixed upstream.

### `qs: ^6.15.3`

-   **Why:** Same cause — `@eyeseetea/d2-api` pins `qs` to an exact version.
    _Measured: removing this entry and reinstalling resolves `qs` back to 6.9.7._
-   **Fixes:** 2 advisories against the version that returns without it — GHSA-6rw7-vpxm-498p (medium)
    and GHSA-w7fw-mjwx-w883 (low). Recorded at both severities deliberately: neither is above the CI
    gate's threshold, and an entry listing only what the gate blocks on would describe the component as
    healthier than the scanner does.
-   **Runtime, not build-only.** `qs` is reached through `@eyeseetea/d2-api`.
-   **Drop when:** `@eyeseetea/d2-api` declares `qs` as a range that admits 6.15.3 or later. That
    package is EyeSeeTea-owned, so the declaration can be fixed upstream.

### `vite: ^6.4.3`

-   **Why:** `vite` is not used to build this project — the build is webpack, and there is no
    `vite.config.ts`. It is present only because `vitest` depends on it. `vitest` declares a `vite`
    range reaching vite 7, and vite 7 declares `engines.node` of `^20.19.0 || >=22.12.0`, which this
    project's Node version does not satisfy. The 6.x line is the newest that installs here.
    _Measured: removing this entry fails both `yarn upgrade` and a fresh resolve with
    `vite@7.3.6: The engine "node" is incompatible with this module`. Note it must be tested that way —
    a plain `yarn install` keeps the existing lockfile entry and wrongly looks unaffected._
-   **Fixes:** The advisories affecting the `vite` 4.x line this project was previously on, and it is
    what keeps the install working at all on Node 18. `vite@6.4.3` has no advisory open against it at
    any severity.
-   **Build and test tooling only.** `vite` never reaches the built artifact.
-   **Drop when:** This project moves to Node 20.19 or later, at which point `vitest` can select vite 7
    on its own and the entry becomes unnecessary. Confirm there is still exactly one `vite` line in the
    tree before removing — a standalone descriptor applies to every consumer of that name.

---

## Compatibility fixtures — not security constraints

### `nodemon: 3.1.11`

-   **Why:** `nodemon` 3.1.12 and later depend on `minimatch` 10, which depends on `brace-expansion` 5,
    which declares `engines.node` of `20 || >=22`. Those releases cannot be installed on this project's
    Node version, so this is a compatibility fixture rather than a floor. The 2.x line is not an option
    either: it pulls an `update-notifier` chain that carries its own findings and resolves `semver` to
    a vulnerable release.
    _Measured: widening this to `^3` fails the install with
    `brace-expansion@5.0.9: The engine "node" is incompatible with this module`; returning to `^2`
    resolves `semver` to 7.0.0 and reinstates `got`._
-   **Fixes:** Keeps a `semver` advisory (GHSA-c2qf-rxjj-qqgw) and a `got` advisory
    (GHSA-pfrx-2q88-qq97) out of the tree, since the 3.x line replaced the chain that introduced both.
-   **Development tooling only.** `nodemon` runs the watch task and is not part of the built artifact.
-   **Drop when:** This project moves to Node 20 or later. At that point this should become a floor
    (`^3`), not a newer fixture.

---

## Findings with no fix available

Recorded because the current tree carries them, not because they are acceptable indefinitely. Each
lists **every** advisory open against the component, at every severity, so that a missing row reads as
a gap rather than as an absence.

### `serialize-javascript@6.0.2`

-   **Chain:** `copy-webpack-plugin` → `serialize-javascript`. `copy-webpack-plugin` declares a range
    covering the 6.x line only.
-   **Advisories open against this component: 2.**

    | Advisory              | Severity | Affected            | First patched |
    | --------------------- | -------- | ------------------- | ------------- |
    | `GHSA-5c6j-r48x-rmvq` | high     | `<= 7.0.2`          | 7.0.3         |
    | `GHSA-qj8w-gfj5-8c6v` | medium   | `>= 5.0.0, < 7.0.5` | 7.0.5         |

-   **Why it cannot be fixed:** A fix is published — 7.0.5 clears both — and cannot be installed here.
    `serialize-javascript@7.0.5` declares `engines.node` of `>=20.0.0`, and the `copy-webpack-plugin`
    release that requests the 7.x line declares `>=20.9.0`. Both are above this project's Node version,
    so neither the direct route nor the parent upgrade is available. This is a **blocked** fix, not a
    missing one.
-   **Impact:** Build tooling only. `copy-webpack-plugin` runs during `yarn build` to copy SQL assets
    into the output directory; `serialize-javascript` is not part of the built artifact and does not
    execute when the CLI runs.
-   **Reachability:** Both advisories require the affected code to serialise attacker-controlled input.
    In this chain the input is the plugin's own build configuration, which is committed here.
-   **Drop when:** This project moves to Node 20 or later, which unblocks both routes at once.

### `xlsx@0.18.5`

-   **Chain:** Direct dependency of this project.
-   **Advisories open against this component: 2.**

    | Advisory              | Severity | Affected   | First patched        |
    | --------------------- | -------- | ---------- | -------------------- |
    | `GHSA-4r6h-8v6p-xvw6` | high     | `< 0.19.3` | none recorded on npm |
    | `GHSA-5pgg-2g8v-p4x9` | high     | `< 0.20.2` | none recorded on npm |

-   **Why it cannot be fixed:** Fixed releases exist, but not on the npm registry. `npm view xlsx
dist-tags` reports 0.18.5 as `latest`, and that is the final version the maintainers published to
    npm; development moved to the vendor's own distribution point. No version selectable from the
    registry escapes the affected ranges. This is distinct from _"no fix exists"_ — the fix exists and
    is not obtainable through this project's package source.
-   **Impact:** Runtime. `xlsx` is used to read and write spreadsheets in the export and
    spreadsheet-parsing commands, so it is part of the shipped tool.
-   **Reachability:** Both advisories are triggered by parsing a crafted workbook — one through
    prototype pollution during sheet parsing, the other through a regular expression that degrades
    badly on crafted input. Any command reading a spreadsheet supplied from outside this repository
    exercises the affected paths.
-   **Drop when:** The maintainers resume publishing fixed releases to npm, or this project adopts the
    vendor's distribution point as a package source, or the spreadsheet-reading code moves to another
    library. Adopting a non-registry package source is a supply-chain decision in its own right and
    should be taken deliberately rather than as part of a dependency update.

---

## Withdrawn advisories

A withdrawn advisory is not remediated. It is **dismissed**. Scanners pick up a withdrawal at
different times, so a withdrawn advisory can sit in a report looking like ordinary work, and
"fixing" one can mean an upgrade that corrects nothing.

| Advisory              | Against           | Withdrawn  | Note                                                                   |
| --------------------- | ----------------- | ---------- | ---------------------------------------------------------------------- |
| `GHSA-gv7w-rqvm-qjhr` | `esbuild@0.25.12` | 2026-06-17 | Reported as patched in a later esbuild. That upgrade corrects nothing. |
| `GHSA-p5wg-g6qr-c7cg` | `eslint@8.57.1`   | 2026-02-03 | Reported as patched in eslint 9. That major upgrade corrects nothing.  |

Check before starting any remediation that costs more than a version bump:

```bash
gh api advisories/<GHSA> --jq '.withdrawn_at // "not withdrawn"'
```

## Constraints that were tried and rejected

Recorded so nobody repeats them. None of these is discoverable from the current tree, because the
change is not there to be found.

| Tried                          | Why it was rejected                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `vite: ^7.3.6`                 | `engines.node` of `^20.19.0 \|\| >=22.12.0`. Install fails outright on Node 18.                      |
| `vite-tsconfig-paths: ^5.1.4`  | ESM-only. `vitest.config.ts` is loaded as CommonJS, so it fails with `ERR_REQUIRE_ESM`. 4.x is dual. |
| `nodemon: ^3` (unpinned)       | Resolves to 3.1.12+, which pulls `brace-expansion@5` and requires Node 20.                           |
| `serialize-javascript: ^7.0.5` | `engines.node` of `>=20.0.0`.                                                                        |
| `copy-webpack-plugin: ^14`     | `engines.node` of `>=20.9.0`. This was the parent-upgrade route to `serialize-javascript` 7.         |

All five become available together if this project moves to Node 20.

## Decay-monitoring checklist

When auditing, treat any of these as a signal that an entry has gone stale:

-   A finding of **any severity** reappears for a package that has an active entry. Do not filter this
    check to critical/high — an exact pin that has become the vulnerable version often shows up first
    as a medium, below the gate's threshold, and can sit there for months.
-   `yarn why <pkg>` shows a resolved version not matching the right-hand side of the entry.
-   **An entry holding a consumer below its declared range.** Compare against what parents actually
    request; an entry that overrides a package's own compatibility statement is not protecting
    anything, and cannot receive patches either.
-   **An entry whose removal changes nothing.** Delete it, reinstall, compare the **resolved versions**.
    But note the `vite` entry above: test by re-resolving (`yarn upgrade`, or a fresh resolve), because
    a plain `yarn install` preserves a satisfying lockfile entry and makes a load-bearing entry look
    inert.
-   **A scanner alert whose prose contradicts the advisory's own data.** A description is written when
    the advisory is published and is not rewritten when a backport lands. Read the machine-readable
    ranges — `gh api advisories/<GHSA> --jq '.vulnerabilities[]'` — against the published version list,
    and treat the summary as a hint.

## What this file must not contain

This repository is public, and so is this file. The dependency inventory it describes is public
already, because `package.json` and `yarn.lock` are in the repository. The reasoning is the part that
needs a limit.

-   Justify reachability with facts about the **dependency**, never with this application's own
    defences. _"The advisory affects an API this package never calls"_ is a statement about
    third-party code that any reader can check. _"Not reachable because our code strips that input"_
    stops being true as soon as someone changes that code without knowing this file depends on it.
-   Write nothing that is not derivable from the public tree. No internal URLs, environment names or
    infrastructure details.
-   A vulnerability in this application's own code does not belong here. That is a private security
    advisory.
-   No before/after finding counts, here or in a pull request description. A count is only true on the
    day it is written. Link to the alerts instead.
