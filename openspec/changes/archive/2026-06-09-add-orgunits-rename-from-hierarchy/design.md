## Context

The `orgunits` command (`src/scripts/commands/orgunits.ts`) is a cmd-ts `subcommands` group that currently exposes a single `remove` subcommand. That subcommand follows the d2-tools clean-architecture pattern: a thin cmd-ts handler builds a repository, injects it into a use case, and the use case orchestrates the work.

## Decisions

### Decision: Expand entity `OrgUnit`, `OrgUnitRepository` interface + `OrgUnitD2Repository` (D2Api)

`OrgUnit` is a `Struct`-based class (`src/domain/entities/OrgUnit.ts`, `OrgUnitAttrs = {id, name, code}`). Expand `OrgUnitAttrs` with the hierarchy fields the feature needs, all **required** (not optional) — modeled as arrays so empty naturally means root/leaf, avoiding any `| undefined` union:

- `ancestors: NamedRef[]` — the ancestor chain, root-first (maps to the DHIS2 `ancestors` field). Carries the parent **name** the affix logic uses. Empty for the root.
- `level: number`
- `children: NamedRef[]` — direct children (maps to DHIS2 `children`). Empty ⇒ leaf.

Add computed getters on the class (derived, not stored): `parent` = `_.last(ancestors)`, `isLeaf` = `_.isEmpty(children)`, and `path` = the DHIS2 path string built from the ancestor ids + own id (`"/" + [...ancestors.map(a => a.id), id].join("/")`).

All instances are built via `OrgUnit.create(...)`. Because the fields are required, the existing fetchers (`getRoot`, `getByIdentifiables` in `src/data/OrgUnitD2Repository.ts`) are updated to request and populate `level`/`ancestors`/`children`, so every `OrgUnit` is complete and the use case reads the immediate parent name via the `parent` getter.

Expand the existing `OrgUnitRepository` with `getLeavesUnderRoots(...)` (paginated) and `save(...)`. Saving doesn't have all owner fields, so `save` fetches each org unit's `:owner` representation, merges the new `name`, and posts via metadata import.

### Decision: Leaf resolution via the API's stored hierarchy fields

Fetch org units under each root using the DHIS2 `path` filter, selecting `id,name,code,level,ancestors[id,name],children[id,name]` (mapping `ancestors → ancestors`). A leaf is any returned org unit with empty `children`; its immediate parent name is the last `ancestors` entry. This computes leaves and parents in one pass without per-node requests. (DHIS2 returns `ancestors` root-first.)

-   **Alternative considered**: recursive top-down traversal issuing a request per node. Rejected — many round-trips and slower for deep trees.

### Decision: Recompute the name from the base each run

Rather than blindly appending, every run recovers the leaf's **base name** and re-applies the current parent name `P`. The base is obtained by stripping exactly one `" - "`-delimited segment: the last segment for `suffix`, the first for `prefix` (`stripOneSegment(name)`). Then `newName = position === "suffix" ? `${base} - ${P}` : `${P} - ${base}``. The leaf is persisted only when `newName !== name`.

This single rule covers both required behaviors:

-   **Idempotency**: re-running with an unchanged parent recomputes the same name, so nothing is written (no double-append).
-   **Parent renames propagate**: an already-affixed leaf whose parent was renamed has its old affix segment stripped and the new parent re-applied (e.g. `Mental Health - Gaza Secondary Healthcare` → `Mental Health - Gaza Secondary Healthcare Center`).

-   **Note / known limitation**: "strip one segment" assumes the affix is a single segment. A leaf whose _base_ name itself contains `" - "` (e.g. `Mental Health - Adults`) is mis-split on first run, dropping the trailing/leading part. This is accepted; the dry-run default is the mitigation — the operator reviews every proposed name before applying `--post`. Spec scenario covers this case.

### Decision: Dry-run vs post in the use case, reporting via return value

The use case **pages** through leaves via `getLeavesUnderRoots` (which returns a pager) and, for each page, computes `{ orgUnit, oldName, newName, skipped }` and only calls `repository.save(...)` when `post` is true. It accumulates a summary (`total`, `renamed`, `skipped`) across pages that the handler prints, mirroring `TranslateCategoryOptionCombosUseCase`'s dry-run/post messaging.

### Decision: `--parent-name-as` validated to `prefix|suffix`

Implemented as a cmd-ts option decoded to a union type so invalid values fail fast with a clear message, consistent with how other commands validate enumerated inputs.

## Risks / Trade-offs

-   **Name length / uniqueness limits** → DHIS2 enforces max length and uniqueness on org unit `name`. Concatenation could exceed limits or collide. Mitigation: the use case surfaces API validation errors per-unit (from `d2-api` import/update response) rather than failing the whole batch silently; dry run lets operators review before posting.
-   **Wrong roots / over-broad selection renames many units** → Mitigation: dry run is the default and prints every proposed change; `--post` is explicit.
-   **Affix mis-split** → because the base name is recovered by stripping one `" - "` segment, a leaf whose base name legitimately contains `" - "` is mis-split on first run (see the recompute decision's known limitation). Mitigation: dry-run is the default and prints every proposed change before `--post`.
-   **Large hierarchies** → A single `path:like` fetch with paging should be sufficient; if needed, batch by root id. Mitigation: page through results and update via metadata import.
