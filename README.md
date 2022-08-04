## Setup

```console
shell:~$ yarn install
shell:~$ yarn build
```

## Execute Program Rules

### Instalation Notes
For this script to work you may need to install svn

### Create report with events or TEA to be updated

```console
shell:~$ node dist/index.js programs run-program-rules \
  --url='http://USER:PASSWORD@localhost:8080' \
  --programs-ids=ORvg6A5ed7z \
  --program-rules-ids=qvk8trY5En6 \
  --org-units-ids=rSAdSn2l11O,vNiy1wYCpUC \
  --start-date=2022-06-02 \
  --end-date=2022-06-04 \
  --save-report=run-program-rules.csv
```

### Create report and post events or TEA

```console
shell:~$ node dist/index.js programs run-program-rules \
  --url='http://USER:PASSWORD@localhost:8080' \
  --programs-ids=ORvg6A5ed7z \
  --program-rules-ids=qvk8trY5En6 \
  --org-units-ids=rSAdSn2l11O,vNiy1wYCpUC \
  --start-date=2022-06-02 \
  --end-date=2022-06-04 \
  --save-report=run-program-rules.csv
  --post
```

## Datasets

### Compare pairs of data sets

```console
shell:~$ node dist/index.js datasets compare \
  --url='http://USER:PASSWORD@localhost:8080' \
  DiMntK7qKZQ-Z3tlf5sqWiK \
  TuL8IOPzpHh-jHF49Vvup66

DiMntK7qKZQ - Z3tlf5sqWiK: non-equal
 {
-  expiryDays: 1
+  expiryDays: 2
 }
TuL8IOPzpHh - jHF49Vvup66: equal
```

### Compare pairs of data sets between two instances

```console
shell:~$ node dist/index.js datasets compare \
  --url='http://USER:PASSWORD@host1:8080' \
  --url2='http://USER:PASSWORD@host2:8080' \
  DiMntK7qKZQ-Z3tlf5sqWiK \
  TuL8IOPzpHh-jHF49Vvup66
```

### Show the schema fields used on the comparison:

```console
shell:~$ node dist/index.js datasets show-schema
{
    "validCompleteOnly": true,
    "dataElementDecoration": true,
    ...
}
```

### Compare two data sets ignoring some of the properties:

```console
shell:~$ node dist/index.js datasets compare \
    --url='http://USER:PASSWORD@localhost:8080' \
    --ignore-properties="expiryDays,sections" \
    DiMntK7qKZQ-Z3tlf5sqWiK

DiMntK7qKZQ - Z3tlf5sqWiK: equal
```

## Translations

### Update objects from spreadsheet

Update any type of DHIS" metadata object using a xlsx spreadsheet as a data source:

```console
shell:~$ node dist/index.js translations from-spreadsheet \
  --url='http://USER:PASSWORD@localhost:8080' \
  --save-payload=payload.json \
  --post \
  translations.xlsx
```

Expected format of `xlsx` file:

-   All sheets in file will be parsed.
-   A Column named `type`/`kind` specifies the DHIS2 entity type (singular). Example: `dataElement`, `dataSet`.
-   Columns named `id`/`name`/`code` will be used to match the existing object in the database. No need to specify all of them.
-   Translation columns should have the format: `field:localeName`. A DHIS2 Locale with that name should exist in the database. Example: `formName:French`.
