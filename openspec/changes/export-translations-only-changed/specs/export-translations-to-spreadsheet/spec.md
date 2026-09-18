## ADDED Requirements

### Requirement: Export objects from a metadata JSON file

The `translations to-spreadsheet` command SHALL accept `--metadata-file=PATH`, a DHIS2 metadata
JSON export (`{"dataElements": [...], ...}`), and take the objects to export (with their
`translations`) from it instead of from the instance. Models are matched by their plural key. The
instance at `--url` SHALL still provide the locales.

#### Scenario: Objects come from the file

- **WHEN** the command runs with `--metadata-file=pkg.json --models='dataElements[formName]'`
- **THEN** the `dataElements` sheet lists the file's data elements, with their `formName` and the
  translations present in the file, and no data element is read from the instance

### Requirement: Export only the objects that need translation

With `--only-changed`, the command SHALL keep an object only when it does not exist in the
instance, or when any selected field differs from the instance value, or when the
`--default-locale` translation of a selected field differs. Values are compared trimmed; fields
not selected in `--models` SHALL be ignored. `--only-changed` SHALL require `--metadata-file`.

#### Scenario: Renamed label is exported, deprecation prefix is not

- **WHEN** the file has data element A with `formName` changed and data element B whose only
  change is a `[DEPRECATED]` prefix on `name`, with `--models='dataElements[formName]'`
- **THEN** A is in the sheet and B is not

#### Scenario: Label changed only through the default-locale translation

- **WHEN** a data element keeps its `formName` but its `en` `FORM_NAME` translation differs from
  the instance, and the command runs with `--default-locale=en`
- **THEN** the data element is in the sheet

#### Scenario: Only-changed without a file is rejected

- **WHEN** the command runs with `--only-changed` and no `--metadata-file`
- **THEN** it exits with an error naming both options

### Requirement: Exclude objects by name

The command SHALL accept `--exclude-names=REGEX` and skip any object whose `name` matches it,
before change detection.

#### Scenario: Deprecated indicators are skipped

- **WHEN** the command runs with `--exclude-names='^\[DEPRECATED\]'` and `indicators[name]`
- **THEN** indicators whose name starts with `[DEPRECATED]` are not in the sheet even though their
  `name` changed

### Requirement: Scope options take several ids

`--program-ids` and `--data-set-ids` SHALL accept comma-separated ids. Against an instance, the
metadata dependency exports of every id SHALL be merged, and an object present in several of
them SHALL appear once.

#### Scenario: Two data sets sharing a data element

- **WHEN** the command runs with `--data-set-ids=DS1,DS2` and both data sets contain data
  element A
- **THEN** A appears once in the `dataElements` sheet

### Requirement: Data set scope applies to a metadata file

With `--metadata-file`, `--data-set-ids=ID1,ID2` SHALL keep only the file objects belonging to
those data sets: data elements listed in their `dataSetElements`, indicators listed in the data
sets, sections whose `dataSet` is one of them, and options of the option sets used by those data
elements. A data set id not found in the file, a requested model with no data set relation, or
`--program-ids` with a file SHALL abort with an error.

#### Scenario: Data element of another form is not exported

- **WHEN** the file has a new data element that belongs only to a data set not in
  `--data-set-ids`
- **THEN** it is not in the sheet, even though it is new

#### Scenario: Options follow their data element

- **WHEN** a scoped data element uses an option set with new options
- **THEN** those options are in the `options` sheet

### Requirement: Match translations stored with Java legacy locale codes

Translation columns SHALL match an object's translations by locale ignoring the Java legacy
language code difference (`in`/`id`, `iw`/`he`, `ji`/`yi`).

#### Scenario: Indonesian translation is shown

- **WHEN** an object has a `FORM_NAME` translation with locale `in` and `Indonesian` (`id`) is a
  requested locale
- **THEN** the `formName: Indonesian` cell holds that translation
