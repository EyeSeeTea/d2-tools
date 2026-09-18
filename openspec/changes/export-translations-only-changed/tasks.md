## 1. Domain layer

-   [x] `Locale`: `normalizeLocaleCode` (Java legacy codes), `isSameLocale`, `haveSameLanguage`
-   [x] `MetadataObject`: `getMetadataObjectField`, `getMetadataObjectTranslation` (shared by the
        spreadsheet repository and the change detection)
-   [x] `MetadataSourceRepository` interface (with the #106 scope options); `MetadataRepository`
        extends it and adds `getByIdsWithTranslations(model, ids)`
-   [x] `DataSetScope`: `buildDataSetScope`, `isInDataSetScope`
-   [x] `ExportTranslationsUseCase`: optional `metadataSource`, options `onlyChanged`,
        `defaultLocale`, `excludeNames`; pure `isChanged`

## 2. Data layer

-   [x] `MetadataJsonFileRepository` reading a DHIS2 metadata JSON export, `dataSetIds` scope by
        membership
-   [x] `MetadataD2Repository`: merge the dependency exports of several program/data set ids
-   [x] `MetadataD2Repository.getByIdsWithTranslations` with chunked `id:in` filter
-   [x] `ExportTranslationsSpreadsheetRepository` matches locales through `isSameLocale`

## 3. Command wiring

-   [x] `--metadata-file`, `--only-changed`, `--default-locale`, `--exclude-names` on
        `translations to-spreadsheet`; reject `--only-changed` without `--metadata-file`
-   [x] `--program-id`/`--data-set-id` → `--program-ids`/`--data-set-ids` (comma-separated)

## 4. Testing

-   [x] Use case: file source, exclude by name, only-changed selection, `isChanged` cases
-   [x] `MetadataJsonFileRepository` (incl. data set scope), `DataSetScope` and `Locale` unit
        tests; `in`/`id` match in the sheet

## 5. Verification

-   [x] `yarn typecheck`, `yarn lint`, `yarn test`
-   [x] README: document the options with a delta-export example
-   [x] Spec under `specs/export-translations-to-spreadsheet`
