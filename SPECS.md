# Project context — d2-tools

> Canonical project overview for both humans and AI agents. This is the project's overview and
> conventions
> For behavioral capability, check specs under `openspec/specs/`.
> For setup/usage details see [`README.md`](./README.md).

## What it is

`d2-tools` is a CLI of maintenance, migration, and data-fixing tools for [DHIS2](https://dhis2.org)
instances. Each tool is a subcommand that talks to a DHIS2 server through the `@eyeseetea/d2-api`
client. The entry point is run with `yarn start <command> --help`.

## Tech stack

-   **Language**: TypeScript (^4.6)
-   **CLI framework**: `cmd-ts` (^0.10) — commands and subcommands
-   **DHIS2 client**: `@eyeseetea/d2-api` (1.18.0-beta.7)
-   **Tests**: Vitest
-   **Build**: Webpack
-   **Lint/format**: ESLint + Prettier
-   **Node**: v18.20.8 (`nvm use`)

## Canonical commands

| Task    | Command                                               |
| ------- | ----------------------------------------------------- |
| Install | `yarn install`                                        |
| Build   | `yarn build` (webpack, production → `dist/`)          |
| Dev run | `yarn start:dev` (tsx, no build step)                 |
| Run     | `yarn start <command> --help` (entry `dist/index.js`) |
| Test    | `yarn test` (→ `vitest run`)                          |
| Lint    | `yarn lint`                                           |
| Format  | `yarn prettify`                                       |

`LOG_LEVEL` (e.g. `debug`, `info`) controls log verbosity: `LOG_LEVEL=debug yarn start <command>`.

## Architecture (Clean Architecture)

Dependencies point inward toward the domain. The domain layer has **no** framework or
infrastructure dependencies; all external access goes through repository **interfaces**.

```
src/
  domain/
    entities/       Domain models (e.g. OrgUnit)
    repositories/   Repository interfaces only (no implementations)
    usecases/       Application logic; depend on repository interfaces
    logger/
  data/             Repository implementations, e.g. *D2Repository backed by D2Api
  scripts/
    commands/       cmd-ts command/subcommand wiring (thin handlers)
    common.ts       Shared CLI helpers: getD2ApiFromArgs, getApiUrlOptions,
                    IdsSeparatedByCommas, …
  utils/            Shared utilities
  types/            Shared types (incl. d2-api re-exports)
```

A command typically: builds a `D2Api` from CLI args (`getD2ApiFromArgs`), constructs a
`*D2Repository`, injects it into a use case, and the use case orchestrates the work. Writes to the
instance are usually gated behind an explicit `--post` flag (dry-run by default).

> Note: `src/capture-core*` is vendored DHIS2 capture-app code and is generally out of scope for
> these tools.

## Code conventions

-   Prefer functional/declarative patterns over imperative loops with mutable state.
-   Apply immutability comprehensively: don't mutate function arguments or shared state, return new
    objects/arrays.
-   Prefer composition over inheritance.
-   New code goes in the correct layer per the architecture above.
-   Import d2-api values/types from `src/types/d2-api.ts` to centralize imports.

## Verification

-   Run Typecheck (`yarn typecheck`)
-   Run linting (`yarn lint`)
-   Run tests
-   Update README/command help with the new subcommand and an example.

## Testing strategy

-   Vitest unit tests cover use cases, repositories, and command behavior.
-   Use in-memory test repositories (e.g. `*TestRepository`) to exercise use cases without hitting a
    real DHIS2 instance.
-   Add/adjust tests whenever behavior changes.

## Git workflow

-   Prettify (`yarn prettify`) before commiting.
-   Branch from `development` (unless the work depends on an unmerged branch).
-   Branch naming: `feature/<name>` for features, `fix/<name>` for bugs, `refactor/<name>` for
    refactors.
-   Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
