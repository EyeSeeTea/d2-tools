# import-translations-from-spreadsheet Specification

## Purpose

Bulk-update the translations of any DHIS2 metadata model from an xlsx spreadsheet, so translators
work in a familiar tool and their output is applied without manual editing in the DHIS2 UI. The
counterpart command `translations to-spreadsheet` generates a re-importable file of this format.

## Requirements

### Requirement: Read translations from an xlsx spreadsheet

The `translations from-spreadsheet` command SHALL take an input xlsx path and parse every sheet in
it, except sheets whose name starts with `!`. Each row describes one metadata object.

A row SHALL declare its model in a `type`/`kind` column, holding the singular model name (e.g.
`dataElement`), which the command pluralizes to address the DHIS2 API. Translation columns SHALL
have the format `<field>: <LocaleName>` (e.g. `formName: French`); one column MAY list several
comma-separated fields sharing a value. Column matching is case-insensitive for the metadata
columns, and locale names are matched ignoring any ` (...)` suffix, so `Spanish` matches a
`Spanish (Spain)` DB locale.

Rows without a model, without any identifier, or with an empty cell SHALL be skipped with a
warning rather than aborting the run: a partially filled translation sheet is the normal case.

#### Scenario: Locale column not defined in the instance

- **WHEN** a column names a locale that does not exist in `/api/locales/dbLocales`
- **THEN** the column is skipped and a warning naming the locale is logged once for the sheet

### Requirement: Match objects by id, code or name

The command SHALL locate the object each row refers to using the `id`/`uid`, `code` and `name`
columns, in that order of precedence, within the row's model. A row need only provide one of them.
Name matching SHALL be case-insensitive. A row matching no object SHALL be reported and skipped.

#### Scenario: Unmatched row does not abort the run

- **WHEN** a row's identifier matches no object of its model
- **THEN** a warning naming the model and identifier is logged, the row is skipped, and the
  remaining rows are still imported

### Requirement: Merge translations, never drop existing ones

The command SHALL merge the spreadsheet translations into the object's existing ones, keyed by
(locale, property): a spreadsheet value overwrites the same locale/property, and any translation
absent from the spreadsheet SHALL be preserved. Only objects whose resulting payload differs from
the current one SHALL be posted.

#### Scenario: Untouched locale survives the import

- **WHEN** an object has a French `FORM_NAME` translation and the sheet only carries a Spanish one
- **THEN** the posted object keeps the French translation and gains the Spanish one

### Requirement: Bare field columns update the object field

A column headed exactly as a translatable field of the row's model, with no locale (`formName`,
`shortName`), SHALL write that field on the object. This is the layout `to-spreadsheet` generates
(source column followed by its locale columns), so an unedited export round-trips as a no-op and
edited source cells are posted without any option. Columns matching no translatable field of the
model SHALL be ignored with a warning once per sheet. Empty cells SHALL not blank the field.

`name` doubles as a lookup key: it SHALL be written only when the row also carries an `id` or
`code`, otherwise a case-insensitive name match would rename the object to the sheet's spelling.
The run SHALL log, per model, how many rows update which fields, so field changes are visible in
the dry run alongside the translations.

#### Scenario: Edited source column is posted

- **WHEN** a row has `id`, `name` and `name: French` columns and the `name` cell differs from the
  object's current name
- **THEN** the posted object has the new `name` and the French `NAME` translation

#### Scenario: Name-only rows are not renamed

- **WHEN** a row identifies the object only by `name`
- **THEN** the name is used to find the object and is not written back as a field

### Requirement: Default-locale columns also update the object field

The command SHALL provide a `--default-locale` option taking the locale code of the instance's
default (DB) language. Columns of that locale SHALL update the object's own field (`formName:
English` writes `formName`) **in addition to** writing the translation, so field and translation
stay in sync and the sheet round-trips through `to-spreadsheet`, which reads the locale columns
from the translations.

The field name SHALL be derived from the column prefix (`Left side description` →
`leftSideDescription`). Locale comparison SHALL use only the language part, so `en` matches a
`en_GB` DB locale. Without the option, no object field is written.

#### Scenario: Default-locale column writes both

- **WHEN** the sheet has a `formName: English` column, English is the `en_GB` DB locale and the
  command runs with `--default-locale=en`
- **THEN** the posted object has both `formName` set and an `en_GB` `FORM_NAME` translation

### Requirement: Warn about fields that would silently do nothing or break the import

The command SHALL check every column's field against the translatable properties the instance
declares in `/api/schemas`, and SHALL warn once per model/field (not per row) when the field is
not translatable there — DHIS2 ignores unknown properties, so such a column would post
successfully while changing nothing.

It SHALL also warn when a column writes a unique-constrained field (`name`, `shortName`),
because a duplicated value makes the whole metadata payload fail to validate.

Both cases are warnings, not errors: the operator reviews them in the dry run before posting.

#### Scenario: Typo in a column field name

- **WHEN** a column is headed `fromName: English` and the instance declares `formName` (not
  `fromName`) as translatable for that model
- **THEN** a warning naming the model and field is logged once, and the run continues

### Requirement: Refresh the Capture apps cache with --bump-versions

The Capture apps cache the metadata of each data set and program, and refresh it only when that
object's `version` changes, so an imported translation stays invisible in the app until the owning
objects are bumped.

The command SHALL provide a `--bump-versions` option that increments the `version` of every data
set and program referencing a data element whose translations changed. The scope is deliberately
data elements only: translating an option set, a tracked entity attribute or a program stage does
not bump anything, even though those are cached too.

The bump SHALL be opt-in, because it writes objects the operator never listed in the spreadsheet.
It SHALL be skipped entirely, with no lookup request, when no object changed.

#### Scenario: Only the owners of a changed data element are bumped

- **WHEN** a data element's translations changed and the command runs with `--bump-versions --post`
- **THEN** the data sets and programs referencing that data element are saved with their version
  incremented by one (starting at 1 when unset), and the ones referencing only other data elements
  are left untouched

#### Scenario: Dry run reports the bumps without writing

- **WHEN** the command runs with `--bump-versions` but without `--post`
- **THEN** the intended bumps are logged and no data set or program is written

### Requirement: Dry-run by default, apply with --post

The command SHALL only persist changes when `--post` is given; otherwise it SHALL validate the
payload against the instance (`importMode=VALIDATE`) and report what would change. The
`--save-payload` option SHALL write the computed metadata payload to a JSON file in either mode,
so it can be reviewed or replayed. The version bumps of `--bump-versions` are posted separately and
are therefore not part of that payload.

#### Scenario: Dry run reports without writing

- **WHEN** the command runs without `--post`
- **THEN** no metadata is modified, the import stats are reported, and the operator is told to add
  `--post` to persist
