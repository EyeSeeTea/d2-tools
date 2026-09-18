## Why

When a feature ships new or renamed metadata (e.g. the CPR "Flex" package), translators need a
spreadsheet with just those objects, not the thousands already translated. Today
`translations to-spreadsheet` exports every object of a model from an instance, and the new
metadata may only exist as a JSON package (or in an instance that also carries unrelated work),
so the delta had to be computed by hand with ad-hoc scripts.

## What Changes

```sh
yarn start translations to-spreadsheet \
  --url=REFERENCE_INSTANCE \
  --metadata-file=feature-metadata.json \
  --only-changed \
  --default-locale=en \
  --exclude-names='^\[DEPRECATED\]' \
  --data-set-id=DS1 \
  --models='dataElements[formName],indicators[name]' \
  --locales=... --include-data out.xlsx
```

-   `--metadata-file=PATH`: objects (with their translations) are read from a DHIS2 metadata JSON
    export instead of the instance. `--url` remains required: locales come from the instance, and
    it is the reference for `--only-changed`.
-   `--only-changed`: keep only objects that do not exist in the instance, or whose selected fields
    differ, or whose `--default-locale` translation of a selected field differs. Requires
    `--metadata-file`.
-   `--default-locale=CODE`: language matched (`en` ~ `en_GB`), same semantics as the import side.
-   `--exclude-names=REGEX`: skip objects whose `name` matches.
-   `--data-set-id` (from #106) also applies to `--metadata-file`: the file's objects are kept by
    membership (data elements, indicators, sections, and the options of the data elements' option
    sets), since a file has no dependency export. `--program-id` is not supported for a file.
-   Translations stored with a Java legacy language code (`in` for Indonesian) are now matched to
    the DB locale (`id`) when filling the existing-translation columns.

Existing invocations are unaffected: without the new options the behavior is unchanged.

Builds on #106 (`--program-id`/`--data-set-id`, short locale references, `Name` column).

## Non-goals

-   Diffing against a second instance (reference is always `--url`).
-   Filtering instance exports by DHIS2 filter expressions; the delta case is served by the file.
