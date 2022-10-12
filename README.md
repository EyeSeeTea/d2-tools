## Setup

```console
shell:~$ sudo apt install subversion # Required by post-install script
shell:~$ yarn install
shell:~$ yarn build
```

## How to run

The entry point CLI is executed with `yarn start`. Pass `--help` to show commands and arguments to commands:

```console
shell:~$ yarn start --help
# ...
shell:~$ yarn start datasets --help
```

The default log level is `info`. Set the desired level using env variable `LOG_LEVEL`:

```console
shell:~$ LOG_LEVEL=debug yarn start datasets
```

Available levels: 'all' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

## Execute Program Rules

### Create report and post events or tracked entity attributes

```console
shell:~$ yarn start programs run-program-rules \
  --url='http://USER:PASSWORD@localhost:8080' \
  --programs-ids=ORvg6A5ed7z \
  --program-rules-ids=qvk8trY5En6 \
  --org-units-ids=rSAdSn2l11O,vNiy1wYCpUC \
  --start-date=2022-06-02 \
  --end-date=2022-06-04 \
  --save-report=run-program-rules.csv
  [--post]
```

Notes:

-   The script does not use the new 2.38 tracker endpoints (`/api/tracker/...`) to keep compatibility with previous DHIS2 versions (older version tested: 2.33). The script takes in account that some fields in models have been renamed or added (example: programRuleVariable in 2.38 has a field `valueType`).

-   Even though data values in events are stored as strings, you can use normal boolean comparisons in your rule conditions/expressions (example: #{SV_FirstConsultation} == true`).

-   Events being considered on a event update:
    -   For tracked program: group events by trackedEntityInstance. That's required to access events in other program stages.
    -   For events program: only the matching event is considered.

## Programs export/import

Export a program with all its associated metadata and data (events, enrollments, tracked entities).

```console
shell:~$ yarn start programs export --url='http://USER:PASSWORD@localhost:8080' \
  --programs-ids=kX2GpLIa75l,kpNc7KvydVz programs.json
```

```console
shell:~$ yarn start programs import --url='http://USER:PASSWORD@localhost:8080' programs.json
```

## Datasets

### Compare pairs of data sets

```console
shell:~$ yarn start datasets compare \
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
shell:~$ yarn start datasets compare \
  --url='http://USER:PASSWORD@host1:8080' \
  --url2='http://USER:PASSWORD@host2:8080' \
  DiMntK7qKZQ-Z3tlf5sqWiK \
  TuL8IOPzpHh-jHF49Vvup66
```

### Show the schema fields used on the comparison:

```console
shell:~$ yarn start datasets show-schema
{
    "validCompleteOnly": true,
    "dataElementDecoration": true,
    ...
}
```

### Compare two data sets ignoring some of the properties:

```console
shell:~$ yarn start datasets compare \
    --url='http://USER:PASSWORD@localhost:8080' \
    --ignore-properties="expiryDays,sections" \
    DiMntK7qKZQ-Z3tlf5sqWiK

DiMntK7qKZQ - Z3tlf5sqWiK: equal
```

### Copy the Organisation Units from a data set to one or more datasets:

```console
shell:~$ yarn start datasets copy-org-units \
    --url='http://USER:PASSWORD@localhost:8080' \
    --origin-dataset=DiMntK7qKZQ \
    --destination-datasets=Z3tlf5sqWiK,jHF49Vvup66 \
    [--replace, -r]
```

Notes:

-   `origin-dataset` and `destination-datasets` has a length check to match DHIS2 ID length.
-   `--origin-dataset` and `--destination-datasets` has a short form: `-o` and `-d`.
-   If a destination data set contains all the origin OUs no action is taken and a warning is shown.
-   The `--replace` flag allows to overwrite the destination Organisation Units. If `--replace` is set, and the OUs are **identical** in the origin and destination data sets, no action is taken and a warning is shown.
-   If no data set is modified a warning is shown.
