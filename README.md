## Setup

The required node version is v16.14.0. Alternatively, you can run:

```console
shell:~$ nvm use
```

To build the script run:

```console
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

Available levels: 'debug' | 'info' | 'warn' | 'error'

## Execute Program Rules

Create report and post events or tracked entity attributes:

```console
shell:~$ yarn start programs run-program-rules \
  --url='http://USER:PASSWORD@HOST:PORT' \
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
shell:~$ yarn start programs export --url='http://USER:PASSWORD@HOST:PORT' \
  --programs-ids=kX2GpLIa75l,kpNc7KvydVz programs.json
```

```console
shell:~$ yarn start programs import --url='http://USER:PASSWORD@HOST:PORT' programs.json
```

## Datasets

### Compare pairs of data sets

```console
shell:~$ yarn start datasets compare \
  --url='http://USER:PASSWORD@HOST:PORT' \
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
  --url='http://USER:PASSWORD@HOST:PORT' \
  --url2='http://USER:PASSWORD@HOST2:PORT' \
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
    --url='http://USER:PASSWORD@HOST:PORT' \
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

### Copy the organisation units from a data set to one or more datasets

```console
shell:~$ yarn start datasets copy-org-units \
    --url='http://USER:PASSWORD@HOST:PORT' \
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

## Translations

Update objects from spreadsheet. Update any type of DHIS2 metadata object using a xlsx spreadsheet as a data source:

```console
shell:~$ yarn start translations from-spreadsheet \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --save-payload=payload.json \
  --post \
  translations.xlsx
```

Expected format of `xlsx` file:

-   All sheets in file will be parsed.
-   A Column named `type`/`kind` specifies the DHIS2 entity type (singular). Example: `dataElement`, `dataSet`.
-   Columns named `id`/`name`/`code` will be used to match the existing object in the database. No need to specify all of them.
-   Translation columns should have the format: `field:localeName`. A DHIS2 Locale with that name should exist in the database. Example: `formName:French`.

## Events

### Move events from one orgunit to another

Move events for program events (so no enrollments/TEIs move is supported):

```
$ yarn start events move-to-org-unit \
  --url='http://USER:PASSWORD@HOST:POST' \
  --from-orgunit-id=qs81OdIPwO9 \
  --to-orgunit-id=ewiA4ufWiki \
  --post
```

### Update events which met the condition

```
yarn start events update-events \
--url='http://USER:PASSWORD@HOST:PORT' \
--root-org-unit='org-unit-id'
--event-ids='event_id_1,event_id_2,event_id_3' \
--data-element-id='data_element_id' \
--condition='true' \
--new-value='' \
--csv-path='./events.csv' \
--post
```

## Data values

### Dangling data values

Get dangling data values and save them in a CSV file:

```console
$ yarn start datavalues get-dangling-values \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --dataelementgroup-ids=OUwLDu1i5xa,SMkbYuGmadE \
  --orgunit-ids=AGZEUf9meZ6 --include-orgunits-children \
  --start-date=1970 --end-date=2023 \
  --notify-email=user@server.org dataValues.csv
```

To delete the dangling data values, use the generated CSV as data source and this command:

```console
$ yarn start datavalues post-dangling-values \
  --url='http://USER:PASSWORD@HOST:PORT' dataValues.csv
```

### Revert data values

It reverts the last data values, using the data value audit. For each of these data values, it finds its N audit records, gets the last valid and first invalid audit record and use them to build an updated data value. Example:

```console
shell:~$ yarn start datavalues revert \
 --url='http://USER:PASSWORD@HOST:PORT' \
 --dataset-ids=Tu81BTLUuCT --orgunit-ids=XKKI1hhyFxk --periods=2020,2021 \
 --date=2022-06-01 --usernames="android" \
 datavalues.json
```

### Delete duplicated event data values

It deletes the duplicated events for some events/tracker programs. An example:

```console
shell:~$ yarn start programs get-duplicated-events \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --save-report=duplicated-events-ecare-pilot.csv \
  --programs-ids=vYRMQ43Zl3Y --org-units-ids=yT7tCISNWG6 \
  --start-date="2022-05-09" --end-date="2022-06-05"
```

Add option `--post` to actually (soft) delete the events.

### Email notification for data values

Notify data values changes and sending an email depending on how long has passed since the last updated.

Using json as a storage:

```
yarn start datavalues monitoring-values \
--url='http://USER:PASSWORD@localhost:8080' \
--storage=json \
--settings-path=./settings.json \
--executions-path=./executions.json \
--email-ds-path-template=./dataset-email-template.json \
--email-de-path-template=./dataelement-email-template.json \
--send-email-after-minutes=5
```

Using dhis datastore as a storage:

```
yarn start datavalues monitoring-values \
--url='http://USER:PASSWORD@localhost:8080' \
--storage=datastore \
--settings-path=d2-notifications.settings \
--executions-path=d2-notifications.executions \
--email-ds-path-template=./dataset-email-template.json \
--email-de-path-template=./dataelement-email-template.json \
--send-email-after-minutes=5
```

## Notifications

### Send user info email

Send an email read from a JSON file to a list of users in a CSV file:

```
$ yarn start notifications send-user-info-notification \
  --url='http://USER:PASSWORD@HOST:PORT' \
  usernames.csv emailContent.json
```

## Load testing

Save a HAR file in a browser (Chrome: Developer Tools -> Network tab -> Export HAR) with the desired scenario to test. Then create a configuration file with the scenarios:

```json
[
    {
        "id": "dashboard",
        "executions": [{ "windowTimeSecs": 300, "users": 1 }],
        "name": "dashboard.har"
    },
    {
        "id": "all",
        "executions": [
            { "windowTimeSecs": 300, "users": 1 },
            { "windowTimeSecs": 300, "users": 10 }
        ],
        "name": "all.har"
    }
]
```

And run the scenarios against the same or a different DHIS2 instance:

```shell
$ yarn start loadTesting run \
  --plans-json=plans.json \
  --hars-folder="." \
  --har-url="https://dhis2.ocg.msf.org" \
  --base-url="https://dhis2-test-elca.ocg.msf.org" \
  --auth='USER:PASSWORD' \
  dashboard all
```

Check results in the output:

```
Plan-results: all - window=300 secs - users=1  | totalTime=35.6 secs | meanTime=35.1 secs  | errors=0/612 (0.00 %)
Plan-results: all - window=300 secs - users=10 | totalTime=106.0 secs | meanTime=77.9 secs | errors=154/6120 (2.52 %)
```

## Users

### Migrate user information from one attribute to another if they're different

Copy email to username:

```bash
$ yarn start users migrate \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --from='email' \
  --to='username' \
  --post
```

Send an email to the user:

```bash
yarn start users migrate \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --send-notification \
  --from='email' \
  --to='username' \
  --template-path='email.json' \
  --post
```

Send an email both to the user and the administrator:

```bash
yarn start users migrate \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --admin-email="admin@example.com" \
  --send-notification \
  --from='email' \
  --to='username' \
  --template-path='email.json' \
  --template-admin-path='email_admin.json'
```

Only generate a csv report without persisting changes:

```bash
yarn start users migrate \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --from='email' \
  --to='username' \
  --csv-path='./users.csv'
```

**email.json** must have the following structure:

```json
{
    "subject": "DHIS2 user migration",
    "body": "<h1>Your username was updated from ${oldValue} to ${newValue} (user ${userId})<h1>",
    "attachments": ["path_to_file.txt"]
}
```

## Move Attributes from a Program

Get all the TEIS in the program and move the value from the attribute in the argument `--from-attribute-id` to the attribute `--to-attribute-id`. Then delete the value in `--from-attribute-id`.

```bash
yarn start programs move-attribute \
--url='http://USER:PASSWORD@HOST:PORT' \
--program-id=WCJhvPcJomX \
--from-attribute-id=MyOceAlOxLK \
--to-attribute-id=YqcpwxxRc1D
```

## Compare metadata between instances

Perform a basic comparison of metadata in two instances. Checks:

-   Which objects exist only in one of them (using ID).
-   Which objects exist in both with same ID but different code.

```bash
$ LOG_LEVEL=debug node dist/index.js sync validate \
  --url="http://admin:district@localhost:8080" \
  --url2="http://admin:district@localhost:8081" \
  --check-models=users,programs

[DEBUG 2024-03-19T09:16:30.299Z] Get objects for instance=1, model=users, page=1
[DEBUG 2024-03-19T09:16:32.878Z] Get objects for instance=2, model=users, page=1
[INFO 2024-03-19T09:16:34.383Z] users in instance 1: 1602
[INFO 2024-03-19T09:16:34.383Z] users in instance 2: 1600
[INFO 2024-03-19T09:16:34.383Z] # Only in instance 1 (count): 2
[DEBUG 2024-03-19T09:16:34.384Z] Only in: [instance=1] users/Tv0nAf1WOVs - name="Josh Smith" - code="joshn.smith@geneva.msf.org"
[DEBUG 2024-03-19T09:16:34.384Z] Only in: [instance=1] users/eRCHQWr82i6 - name="MHAM Samos" - code="samos@geneva.msf.org "
[INFO 2024-03-19T09:16:34.384Z] # Only in instance 2 (count): 0
[INFO 2024-03-19T09:16:34.400Z] # Check ID/code mismatch: 0
[DEBUG 2024-03-19T09:16:34.400Z] Get objects for instance=1, model=programs, page=1
[DEBUG 2024-03-19T09:16:35.220Z] Get objects for instance=2, model=programs, page=1
[INFO 2024-03-19T09:16:35.509Z] programs in instance 1: 41
[INFO 2024-03-19T09:16:35.509Z] programs in instance 2: 41
[INFO 2024-03-19T09:16:35.509Z] # Only in instance 1 (count): 0
[INFO 2024-03-19T09:16:35.509Z] # Only in instance 2 (count): 0
[INFO 2024-03-19T09:16:35.509Z] # Check ID/code mismatch: 0
[INFO 2024-03-19T09:16:35.510Z] Output report: sync-validate.json
```

## Indicators

### Get Indicators items report

Get a CSV with the IDs of the items used by Indicators:

```console
shell:~$ yarn start indicators get-ref-ids \
--url='https://admin:district@play.dhis2.org/2.38.6/' \
--indicators=Uvn6LCg7dVU,ReUHfIn0pTQ \
--ds-filter=QX4ZTUbOt3a,aLpVgfXiz0f \
--file=./indicatorsRefIDs.csv
```

Working items types: dataElements, programDataElements, programIndicator.

The ds-filter option allows to filter which dataSets are used.

File option can be a file or directory path, if its a directory path the file will be named `indicatorsRefIDs.csv`

CSV headers:

UID | Indicator | Numerator | Numerator Description | List of referenced dataElements | List of referenced programDataElements | List of referenced categoryOptionCombos | List of referenced Indicators | List of referenced dataSets | List of referenced programs | Denominator | Denominator Description | List of referenced dataElements | List of referenced programDataElements | List of referenced categoryOptionCombos | List of referenced Indicators | List of referenced dataSets | List of referenced programs

### Get Indicators dataElements values report

Get a CSV with a report of the values of dataElements and categoryOptionCombos:

```console
shell:~$ yarn start indicators get-de-values-report \
--url='https://admin:district@play.dhis2.org/2.38.6/' \
--indicators=Uvn6LCg7dVU,ReUHfIn0pTQ \
--org-unit=DiszpKrYNg8 \
--period=2024 \
--ds-filter=QX4ZTUbOt3a,aLpVgfXiz0f \
--file=./indicatorsValuesReport.csv
```

The ds-filter option allows to filter which dataSets are used.

File option can be a file or directory path, if its a directory path the file will be named `indicatorsValuesReport.csv`

CSV headers:

dataElement ID | dataElement Name | categoryOptionCombo ID | categoryOptionCombo Name | Value

## User monitoring scripts

### Users Monitoring

#### Execution:

```
yarn install

yarn build

yarn start usermonitoring run-users-monitoring   --config-file config.json
```

#### Debug:

```
yarn install

yarn build:dev

LOG_LEVEL=debug node --inspect-brk dist/index.js usermonitoring run-users-monitoring   --config-file config.json
```

#### Requirements:

A config json file to get the user/password and server:

```
{
    "URL": {
        "username": "",
        "password": "",
        "server": "http://localhost:8080"
    }
}
```

The datastore:
d2-tools -> user-monitoring:

The datastore must contain:

A list of excluded_roles (could be an empty list [])

A list of excluded roles by group (could be an empty list [])

A list of excluded roles by role (could be an empty list [])

A list of excluded roles by user (could be an empty list [])

List of excluded users (the script will ignore them) (could be an empty list [])

A minimum group to add that group to the users without any template group (WIDP requirement)

A minimum role to add that role to the users without any role (DHIS requirement)

A boolean variable push_report to determine if the script must send the report after processing all users

A push_program_id variable with the program ID to send the report

A list of templates (user with the valid roles, and group to identify which users could use those roles).

An example of the file:

```JSON
{
  "EXCLUDE_ROLES": [
    {
      "id": "byLnQNR1v1B",
      "name": "App - Leprosy WER Report"
    }
  ],
  "EXCLUDE_ROLES_BY_GROUPS": [
    {
      "group": {
        "id": "ZXEVDM9XRea",
        "name": "MAL_Malaria access"
      },
      "role": {
        "id": "hXY2OtVz70P",
        "name": "App - DHIS2 MAL Approval Report"
      }
    }
  ],
  "EXCLUDE_ROLES_BY_ROLE": [
    {
      "active_role": {
        "id": "ADf4WvGrP2q",
        "name": "App - Bulk Load"
      },
      "ignore_role": {
        "id": "A36hTe5VUMS",
        "name": "Export metadata"
      }
    }
  ],
  "EXCLUDE_ROLES_BY_USERS": [
    {
      "role": {
        "id": "hOYM2imoNmZ",
        "name": "App - Android Settings app"
      },
      "user": {
        "id": "wUd8NBL7fn2",
        "name": "rose.mabelle"
      }
    }
  ],
  "EXCLUDE_USERS": [
    {
      "id": "smGarTiKDdV",
      "name": "dev.user"
    }
  ],
  "MINIMAL_GROUP": {
    "id": "UmSnxmr4LE0",
    "name": "WIDP Users"
  },
  "MINIMAL_ROLE": {
    "id": "vOLtPCt8WeB",
    "name": "Backend access"
  },
  "PUSH_PROGRAM_ID": {
    "id": "tBI5HRoOMUz",
    "name": "ADMIN_Users_Check(Event)"
  },
  "PUSH_REPORT": true,
  "TEMPLATE_GROUPS": [
    {
      "group": {
        "id": "UfhhwZK73Lg",
        "name": "WIDP IT team"
      },
      "template": {
        "id": "cNtWc18LXBS",
        "name": "widp_it_team.template"
      }
    },
    {
      "group": {
        "id": "L5dlGQ4m5av",
        "name": "WIDP User Manager"
      },
      "template": {
        "id": "Q2e3xq4hRCj",
        "name": "widp_manager.template"
      }
    },
    {
      "group": {
        "id": "sCjEPgiOhP1",
        "name": "WIDP admins"
      },
      "template": {
        "id": "kxaP3vUEnJn",
        "name": "widp_admins.template"
      }
    },
    {
      "group": {
        "id": "e5NqEzmd8Ql",
        "name": "WIDP external developers"
      },
      "template": {
        "id": "FnkRtcOGOVQ",
        "name": "widp_external_developers.template"
      }
    },
    {
      "group": {
        "id": "UmSnxmr4LE0",
        "name": "WIDP Users"
      },
      "template": {
        "id": "WT6QkP45vEC",
        "name": "widp_user.template"
      }
    }
  ]
}
```

### Users Authorities Monitoring

#### Execution:

```bash
yarn install

yarn build

yarn start usermonitoring authorities-monitoring --config-file config.json

# To get the debug logs and store them in a file use:
LOG_LEVEL=debug yarn start usermonitoring authorities-monitoring --config-file config.json &> authorities-monitoring.log
```

#### Parameters:

-   `--config-file`: Connection and webhook config file.
-   `-s` | `--set-datastore`: Write users data to datastore, use in script setup. It assumes there is a monitoring config in d2-tools/user-monitoring.

#### Requirements:

A config file with the access info of the server and the message webhook details:

```JSON
{
    "URL": {
        "username": "user",
        "password": "passwd",
        "server": "https://dhis.url/"
    },
    "WEBHOOK": {
        "ms_url": "http://webhook.url/",
        "proxy": "http://proxy.url/",
        "server_name": "INSTANCE_NAME"
    }
}
```

This reports stores data into the `d2-tools.user-monitoring` datastore in a new entry named `AUTHORITIES_MONITOR`. This entry needs to be setup before the first run to get a correct report.
Its possible to leave `usersByAuthority` empty and use the `-s` flag to populate it.

A sample:

```JSON
"AUTHORITIES_MONITOR": {
    "authoritiesToMonitor": [
      "AUTH1",
      "AUTH2"
    ],
    "lastExecution": "1970-01-01T00:00:00,000",
    "usersByAuthority": {
      "AUTH1": [
        {
          "id": "lJf6FW6vtDD",
          "name": "fake user 1",
          "userRoles": [
            {
              "id": "So7ZSqi9ovy",
              "name": "Role 1"
            }
          ]
        },
        {
          "id": "wXGwwP53ngu",
          "name": "fake user 2",
          "userRoles": [
            {
              "id": "So7ZSqi9ovy",
              "name": "Role 1"
            }
          ]
        }
      ],
       "AUTH2": [
        {
          "id": "wXGwwP53ngu",
          "name": "fake user 2",
          "userRoles": [
            {
              "id": "So7ZSqi9ovy",
              "name": "Role 1"
            }
          ]
        }
      ]
    }
  }
```
