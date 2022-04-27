## Setup

```console
shell:~$ yarn install
shell:~$ yarn build
```

## Datasets

### Compare pairs of data sets

```console
shell:~$ node dist/index.js datasets compare \
  --url 'http://USER:PASSWORD@localhost:8080' \
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
  --url 'http://USER:PASSWORD@host1:8080' \
  --url2 'http://USER:PASSWORD@host2:8080' \
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
    --dhis2-url 'http://USER:PASSWORD@localhost:8080' \
    --ignore-properties="expiryDays,sections" \
    DiMntK7qKZQ-Z3tlf5sqWiK

DiMntK7qKZQ - Z3tlf5sqWiK: equal
```
