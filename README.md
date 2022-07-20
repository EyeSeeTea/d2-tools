## Setup

```console
shell:~$ yarn install
shell:~$ yarn build
```

## Execute Program Rules

### Instalation Notes

For this script to work you may need to install svn.

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

## Organisation Units

The output SQL file (`remove_orgunits.sql` for example) can be executed against
a running [d2-docker](https://github.com/eyeSeeTea/d2-docker) instance with
`d2-docker run-sql remove_orgunits.sql`.

### Create an SQL file to remove any orgunit below the country level

```console
shell:~$ node dist/index.js orgunits remove \
    --level 3 \
    --output-file remove_country_subunits.sql
```

### Create an SQL file to remove all org subunits of Canada

```console
shell:~$ node dist/index.js orgunits remove \
    --path /H8RixfF8ugH/wP2zKq0dDpw/AJBfDthkySs \
    --output-file remove_canada_subunits.sql
```

where `/H8RixfF8ugH/wP2zKq0dDpw/AJBfDthkySs` would be the dhis2 path of Canada.
