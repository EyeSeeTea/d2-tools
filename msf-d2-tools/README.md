## Setup

```
$ yarn install
$ yarn build
```

## Datasets

Compare two data sets:

```
$ node dist/index.js datasets compare --dhis2-url 'http://USER:PASSWORD@localhost:8080' DiMntK7qKZQ-Z3tlf5sqWiK
DiMntK7qKZQ - Z3tlf5sqWiK: non-equal
 {
-  expiryDays: 1
+  expiryDays: 2
 }
```

Show the schema fields used on the `compare` command:

```
$ node dist/index.js datasets show-schema
{
    "validCompleteOnly": true,
    "dataElementDecoration": true,
    ...
}
```

Compare the data sets, ignoring some of the properties:

```
$ node dist/index.js datasets compare \
    --dhis2-url 'http://USER:PASSWORD@localhost:8080' \
    --ignore-properties="expiryDays,sections" \
    DiMntK7qKZQ-Z3tlf5sqWiK
DiMntK7qKZQ - Z3tlf5sqWiK: equal
```
