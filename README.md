## Setup

```console
shell~$ yarn install
shell~$ yarn build
```

## Datasets

Compare two data sets:

```console
shell~$ node dist/index.js datasets compare --dhis2-url 'http://USER:PASSWORD@localshell8080' DiMntK7qKZQ-Z3tlf5sqWiK
DiMntK7qKZQ - Z3tlf5sqWiK: non-equal
 {
-  expiryDays: 1
+  expiryDays: 2
 }
```

Show the schema fields used on the `datasets compare` command:

```console
shell~$ node dist/index.js datasets show-schema
{
    "validCompleteOnly": true,
    "dataElementDecoration": true,
    ...
}
```

Compare two data sets, ignoring some of the properties:

```console
shell~$ node dist/index.js datasets compare \
    --dhis2-url 'http://USER:PASSWORD@localshell8080' \
    --ignore-properties="expiryDays,sections" \
    DiMntK7qKZQ-Z3tlf5sqWiK
DiMntK7qKZQ - Z3tlf5sqWiK: equal
```
