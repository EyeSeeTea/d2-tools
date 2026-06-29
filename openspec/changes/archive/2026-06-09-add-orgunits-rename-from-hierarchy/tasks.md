## 1. Domain layer

-   [x] Expand existing `OrgUnit` domain entity (`Struct` class) with required fields: `level: number`, `ancestors: NamedRef[]` (root-first; carries the parent name), `children: NamedRef[]`. Add computed getters `parent` (`_.last(ancestors)`), `isLeaf` (`_.isEmpty(children)`), and `path` (built from ancestor ids + own id). Build via `OrgUnit.create`; update existing fetchers (`getRoot`, `getByIdentifiables`) to populate the new fields.
-   [x] Use existing `OrgUnitRepository` interface in `src/domain/repositories/` and add methods `getLeavesUnderRoots(rootIds: Id[], options: {page: number, pageSize: number}): Promise<Paginated<OrgUnit>>` and `save(orgUnits: OrgUnit[]): Promise<void>`
-   [x] Create `RenameOrgUnitsFromHierarchyUseCase` in `src/domain/usecases/` that takes the repository and computes, per leaf, `{ orgUnit, oldName, newName, skipped }`. Save orgUnit in a paginated way.
-   [x] Implement affix logic (`prefix`/`suffix`) with fixed `" - "` separator: strip one separator segment to recover the base name, re-affix with the current parent, and write only when the recomputed name differs from the current name
-   [x] Gate writes on a `post` option; return a summary `{ total, renamed, skipped }`

## 2. Data layer

-   [x] Implement new methods in `OrgUnitD2Repository` in `src/data/`.
-   [x] Implement leaf resolution by fetching `organisationUnits` filtered by `ancestors.id:in:<rootIds>` (descendants of any root, native paging), requesting `id,name,code,level,ancestors[id,name],children[id,name]`, returning the ones with empty `children`
-   [x] Implement `save` agnostically: fetch each org unit's `:owner` payload, merge the entity attributes, and post via metadata import (`runMetadata` rejects with the aggregated API error on a non-OK status)

## 3. Command wiring

-   [x] Add `renameFromHierarchyCmd` (cmd-ts `command`) with `getApiUrlOptions()`, `--root-orgunit-ids` (`IdsSeparatedByCommas`), `--parent-name-as` (validated `prefix|suffix`), and `--post` flag
-   [x] In the handler, build `getD2ApiFromArgs(args)` → `OrgUnitD2Repository` → use case; print dry-run vs post summary like `translateCocsCmd`
-   [x] Register the subcommand as `rename-from-hierarchy` in the `orgunits` `subcommands` group in `src/scripts/commands/orgunits.ts`
-   [x] Exit non-zero with a clear message when `--parent-name-as` is invalid or no root ids are given (handled by the cmd-ts decoders)

## 4. Testing

-   [x] Create testing repository (`OrgUnitTestRepository`)
-   [x] Create unit tests for the use case.

## 5. Verification

-   [x] Run Typecheck (`yarn typecheck`) and linting (`yarn lint`) clean
-   [x] Run `yarn test`
-   [x] Update README/command help with the new subcommand and an example
