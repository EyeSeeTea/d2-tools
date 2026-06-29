# orgunits-rename-from-hierarchy Specification

## Purpose
TBD - created by archiving change add-orgunits-rename-from-hierarchy. Update Purpose after archive.
## Requirements
### Requirement: Rename leaf org units from a set of root org units

The `orgunits rename-from-hierarchy` command SHALL accept one or more root org unit IDs and rename every leaf (last-level) org unit descended from those roots by combining the leaf's own name with its immediate parent org unit's name. The two parts SHALL be joined with the separator `" - "` (space-hyphen-space).

A leaf org unit is any org unit that has no children. Root org units MAY be at any hierarchy level; the command SHALL traverse downwards to reach the leaves.

#### Scenario: Leaf renamed with parent name as suffix

- **WHEN** the command runs with `--root-orgunit-ids=GAZA` and `--parent-name-as=suffix`, where `GAZA` ("Gaza Secondary Healthcare") has a leaf child named "Mental Health"
- **THEN** the leaf's new name is "Mental Health - Gaza Secondary Healthcare"

#### Scenario: Leaf renamed with parent name as prefix

- **WHEN** the command runs with `--parent-name-as=prefix` for the same leaf
- **THEN** the leaf's new name is "Gaza Secondary Healthcare - Mental Health"

#### Scenario: Root given at a level above the parent

- **WHEN** a root org unit ID is provided that sits two or more levels above the leaves
- **THEN** the command finds all leaf descendants and renames each using the leaf's immediate parent's name (not the provided root's name)

### Requirement: Parent affix position is configurable

The command SHALL provide a `--parent-name-as` option accepting the values `prefix` or `suffix`. The command SHALL reject any other value with a non-zero exit code and an explanatory message.

#### Scenario: Invalid affix value rejected

- **WHEN** the command runs with `--parent-name-as=middle`
- **THEN** the command exits with a non-zero status and reports that the value must be `prefix` or `suffix`

### Requirement: Dry-run by default, apply with --post

The command SHALL only persist name changes to the DHIS2 instance when the `--post` flag is provided. Without `--post`, the command SHALL compute and report the intended renames without modifying any org unit.

#### Scenario: Dry run previews without writing

- **WHEN** the command runs without `--post`
- **THEN** no org unit metadata is modified on the instance, and the command reports each leaf's current name and proposed new name

#### Scenario: Post applies changes

- **WHEN** the command runs with `--post`
- **THEN** the affected leaf org units are updated on the instance with their new names, and the command reports how many were renamed

### Requirement: New name is recomputed from the base name each run

The command SHALL recompute each leaf's name on every run rather than blindly appending. It SHALL recover the leaf's **base name** by stripping the existing affix segment — exactly one `" - "`-delimited segment, the last segment for `suffix` and the first segment for `prefix` — and SHALL then re-apply the **current** parent name to that base. A leaf SHALL be written only when the recomputed name differs from its current name; otherwise it SHALL be reported as unchanged.

#### Scenario: Re-run with an unchanged parent is a no-op

- **WHEN** the command is run a second time with the same arguments after a successful `--post`, and no parent name has changed
- **THEN** the recomputed name equals the current name for every leaf, so no org unit is written and all are reported as unchanged

#### Scenario: Parent rename propagates to leaves

- **WHEN** a leaf is named "Mental Health - Gaza Secondary Healthcare", its parent has since been renamed to "Gaza Secondary Healthcare Center", and the command runs with `--parent-name-as=suffix` and `--post`
- **THEN** the affix segment is stripped to recover the base "Mental Health" and the leaf is rewritten to "Mental Health - Gaza Secondary Healthcare Center"

#### Scenario: Base name containing the separator is mis-split on first run

- **WHEN** a leaf has never been affixed but its name already contains `" - "` (e.g. "Mental Health - Adults") and the command runs with `--parent-name-as=suffix`
- **THEN** stripping one trailing segment recovers the base "Mental Health" (dropping "Adults"), which is a known limitation; the dry-run default exists so the operator reviews the proposed names before applying `--post`

