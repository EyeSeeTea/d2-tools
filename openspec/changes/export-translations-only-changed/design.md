## Context

`translations to-spreadsheet` (`ExportTranslationsUseCase`) fetches all objects of each model
through `MetadataRepository.getAllWithTranslations` and hands one `ModelTranslationsExport` per
model to `ExportTranslationsSpreadsheetRepository`. The source of the objects and the reference
instance were the same thing.

## Decisions

### Decision: Separate "source of objects" from "reference instance"

A narrow `MetadataSourceRepository` interface (`getAllWithTranslations` only) is the source of the
objects to export; `MetadataRepository` extends it, so the instance keeps being the default source.
`MetadataJsonFileRepository` (data layer) implements the source from a metadata JSON export: it
pluralizes the requested models, tags each object with its `model`, defaults `translations` to `[]`
and keeps every other field so source columns (`formName`, ...) can be filled.

The use case receives an optional `metadataSource`; the command handler builds it from
`--metadata-file`. Locales and the reference objects always come from the instance (`--url`).

### Decision: Reference lookup by id, chunked

`MetadataRepository.getByIdsWithTranslations(model, ids)` fetches only the file's ids from the
instance (`/api/metadata?model:fields=:owner&model:filter=id:in:[...]`, chunks of 100) instead of
downloading the whole model. Objects missing from the response are "new".

### Decision: Change detection is a pure domain function

`isChanged(object, reference, fields, defaultLocale)` compares, for the selected fields only:
the trimmed field value and (when a default locale is given) the trimmed translation of that field
in the default locale. Non-selected fields are ignored on purpose: a `[DEPRECATED]` prefix on
`name` does not require re-translating `formName`. The default-locale comparison covers labels
that are changed only through the `en` translation, which is how some projects keep a long English
label separate from the short `formName`.

### Decision: Data set scope of a file resolved by membership

`--data-set-ids` is one option with one meaning ("the objects of these data sets") and two
implementations behind `MetadataSourceRepository.getAllWithTranslations(models, { dataSetIds })`:
the instance merges the dependency exports of each id (#106, generalized to a list, deduplicated
by model+id); the file, which has no such export, builds a `DataSetScope` (domain entity) from
its own data sets and data elements: `dataSetElements` give
the data elements, the data set `indicators` give the indicators, the scoped data elements'
`optionSet` refs give the option sets; sections match through their `dataSet` ref.
`isInDataSetScope` dispatches on the object's model and rejects models with no data set relation,
so a wrong `--models` fails fast. `--program-ids` with a file is rejected.

### Decision: Java legacy locale codes

DHIS2 stores Indonesian translations with locale `in` while `/api/locales/db` reports `id`
(same for `iw`/`he`, `ji`/`yi`). `normalizeLocaleCode` in the `Locale` entity maps legacy codes
and `isSameLocale`/`haveSameLanguage` use it; the spreadsheet repository and the change detection
match translations through it, so existing Indonesian translations appear in their column.

## Data flow

CLI args → `MetadataJsonFileRepository` (file, scoped by `dataSetIds`) + `MetadataD2Repository`/
`LocalesD2Repository` (instance) → `ExportTranslationsUseCase.getObjects` (exclude by name →
fetch reference by ids → `isChanged`) → `ModelTranslationsExport[]` →
`ExportTranslationsSpreadsheetRepository.save`.

## Risks / Trade-offs

-   The file's own translations are what the sheet shows as "existing" translations. They are
    expected to have been exported from the reference instance; otherwise translators see stale
    values (they are still re-translating the row anyway).
-   `--only-changed` without `--metadata-file` is rejected: comparing the instance with itself
    yields an empty sheet.
