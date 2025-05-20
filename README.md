## Setup

The required node version is v16.14.0. Alternatively, you can run:

```shell
nvm use
```

To build the script run:

```shell
yarn install
yarn build
```

## How to run

The entry point CLI is executed with `yarn start`. Pass `--help` to show commands and arguments to commands:

```shell
yarn start --help
# ...
yarn start datasets --help
```

The default log level is `info`. Set the desired level using env variable `LOG_LEVEL`:

```shell
LOG_LEVEL=debug yarn start datasets
```

Available levels: 'debug' | 'info' | 'warn' | 'error'

## Tools index

-   [Execute Program Rules](#execute-program-rules)
-   [Programs export/import](#programs-exportimport)
-   [Datasets](#datasets)
    -   [Compare pairs of data sets](#compare-pairs-of-data-sets)
    -   [Compare pairs of data sets between two instances](#compare-pairs-of-data-sets-between-two-instances)
    -   [Show the schema fields used on the comparison](#show-the-schema-fields-used-on-the-comparison)
    -   [Compare two data sets ignoring some of the properties](#compare-two-data-sets-ignoring-some-of-the-properties)
-   [Organisation Units](#organisation-units)
    -   [Create an SQL file to remove any orgunit below the country level](#create-an-sql-file-to-remove-any-orgunit-below-the-country-level)
    -   [Create an SQL file to remove all org subunits of Canada](#create-an-sql-file-to-remove-all-org-subunits-of-canada)
    -   [Copy the organisation units from a data set to one or more datasets](#copy-the-organisation-units-from-a-data-set-to-one-or-more-datasets)
-   [Translations](#translations)
-   [Events](#events)
    -   [Move events from one orgunit to another](#move-events-from-one-orgunit-to-another)
    -   [Update events which met the condition](#update-events-which-met-the-condition)
-   [Data values](#data-values)
    -   [Dangling data values](#dangling-data-values)
    -   [Revert data values](#revert-data-values)
    -   [Delete duplicated event data values](#delete-duplicated-event-data-values)
    -   [Email notification for data values](#email-notification-for-data-values)
-   [Notifications](#notifications)
    -   [Send user info email](#send-user-info-email)
-   [Load testing](#load-testing)
-   [Users](#users)
    -   [Migrate user information from one attribute to another if they're different](#migrate-user-information-from-one-attribute-to-another-if-theyre-different)
    -   [Rename username](#rename-username)
-   [User monitoring](#user-monitoring)
    -   [Users Permissions Fixer and 2FA Reporter](#users-permissions-fixer-and-2fa-reporter)
    -   [Users Authorities Monitoring](#users-authorities-monitoring)
    -   [User Groups Monitoring](#user-groups-monitoring)
    -   [User Templates Monitoring](#user-templates-monitoring)
-   [Move Attributes from a Program](#move-attributes-from-a-program)
-   [Compare metadata between instances](#compare-metadata-between-instances)
-   [Indicators](#indicators)
    -   [Get Indicators items report](#get-indicators-items-report)
    -   [Get Indicators dataElements values report](#get-indicators-dataelements-values-report)
-   [Tracked Entities](#tracked-entities)
    -   [Transfer](#transfer)
-   [Options](#options)
    -   [Rename](#rename)
-   [Data](#data)
    -   [Get report](#get-report)
-   [Enrollments](#enrollments)
    -   [Close Enrollments with Events older than a date](#close-enrollments-with-events-older-than-a-date)

## Execute Program Rules

Create report and post events or tracked entity attributes:

```shell
yarn start programs run-program-rules \
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

```shell
yarn start programs export --url='http://USER:PASSWORD@HOST:PORT' \
  --programs-ids=kX2GpLIa75l,kpNc7KvydVz programs.json
```

```shell
yarn start programs import --url='http://USER:PASSWORD@HOST:PORT' programs.json
```

## Datasets

### Compare pairs of data sets

```shell
yarn start datasets compare \
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

```shell
yarn start datasets compare \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --url2='http://USER:PASSWORD@HOST2:PORT' \
  DiMntK7qKZQ-Z3tlf5sqWiK \
  TuL8IOPzpHh-jHF49Vvup66
```

### Show the schema fields used on the comparison:

```shell
yarn start datasets show-schema
{
    "validCompleteOnly": true,
    "dataElementDecoration": true,
    ...
}
```

### Compare two data sets ignoring some of the properties:

```shell
yarn start datasets compare \
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

```shell
node dist/index.js orgunits remove \
    --level 3 \
    --output-file remove_country_subunits.sql
```

### Create an SQL file to remove all org subunits of Canada

```shell
node dist/index.js orgunits remove \
    --path /H8RixfF8ugH/wP2zKq0dDpw/AJBfDthkySs \
    --output-file remove_canada_subunits.sql
```

where `/H8RixfF8ugH/wP2zKq0dDpw/AJBfDthkySs` would be the dhis2 path of Canada.

### Copy the organisation units from a data set to one or more datasets

```shell
yarn start datasets copy-org-units \
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

### Set all DataSets `skipOffline` where last data input period year was 'year' indicated or earlier

```console
shell:~$ yarn start datasets set-skip-offline \
    --url='http://USER:PASSWORD@HOST:PORT' \
    --year 2023 \
    [--disable -d]
```

Notes:

-   `skipOffline` will be enabled by default.
-   Use `--disable` or `-d` flag to disable `skipOffline`.
-   If no data set is modified a warning is shown.

## Translations

Update objects from spreadsheet. Update any type of DHIS2 metadata object using a xlsx spreadsheet as a data source:

```shell
yarn start translations from-spreadsheet \
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

### Detect events assigned to organisation units outside their enrollment

When enrollments are transferred to another org unit, the existing events keep their original org unit. While that's the expected default behaviour, sometimes we need to detect and fix these mismatches:

```shell
$ yarn start:dev events detect-orgunits-outside-enrollment \
  --url "http://localhost:8080" --auth "USER:PASS" \
  --notify-email="SUBJECT,EMAIL1,EMAIL2,..." \
  --post
```

### Move events from one orgunit to another

Move events for program events (so no enrollments/TEIs move is supported):

```shell
$ yarn start events move-to-org-unit \
  --url='http://USER:PASSWORD@HOST:POST' \
  --from-orgunit-id=qs81OdIPwO9 \
  --to-orgunit-id=ewiA4ufWiki \
  --post
```

### Update events which met the condition

```shell
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

### Recode boolean to ternary optionSet values

When a boolean data value (true/false) is changed to some ternary option set (codes: Yes, No, N/A), we need to recode the existing events:

```shell
yarn start events recode-boolean-data-values \
    --url "http://localhost:8080" --auth "USER:PASSWORD" \
    --program-id="sPRFZ9fP9w3" --ternary-optionset-id="u4jlYf94QEy"
```

## Data values

### Dangling data values

Get dangling data values and save them in a CSV file:

```shell
$ yarn start datavalues get-dangling-values \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --dataelementgroup-ids=OUwLDu1i5xa,SMkbYuGmadE \
  --orgunit-ids=AGZEUf9meZ6 --include-orgunits-children \
  --start-date=1970 --end-date=2023 \
  --notify-email=user@server.org dataValues.csv
```

To delete the dangling data values, use the generated CSV as data source and this command:

```shell
$ yarn start datavalues post-dangling-values \
  --url='http://USER:PASSWORD@HOST:PORT' dataValues.csv
```

### Revert data values

It reverts the last data values, using the data value audit. For each of these data values, it finds its N audit records, gets the last valid and first invalid audit record and use them to build an updated data value. Example:

```shell
yarn start datavalues revert \
 --url='http://USER:PASSWORD@HOST:PORT' \
 --dataset-ids=Tu81BTLUuCT --orgunit-ids=XKKI1hhyFxk --periods=2020,2021 \
 --date=2022-06-01 --usernames="android" \
 datavalues.json
```

### Delete duplicated event data values

It deletes the duplicated events for some events/tracker programs. An example:

```shell
yarn start programs get-duplicated-events \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --save-report=duplicated-events-ecare-pilot.csv \
  --programs-ids=vYRMQ43Zl3Y --org-units-ids=yT7tCISNWG6 \
  --start-date="2022-05-09" --end-date="2022-06-05"
```

Add option `--post` to actually (soft) delete the events.

### Email notification for data values

Notify data values changes and sending an email depending on how long has passed since the last updated.

Using json as a storage:

```shell
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

```shell
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

```shell
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

And run the specificied scenarios against the same or a different DHIS2 instance:

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

```shell
$ yarn start users migrate \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --from='email' \
  --to='username' \
  --post
```

Send an email to the user:

```shell
yarn start users migrate \
  --url='http://USER:PASSWORD@HOST:PORT' \
  --send-notification \
  --from='email' \
  --to='username' \
  --template-path='email.json' \
  --post
```

Send an email both to the user and the administrator:

```shell
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

```shell
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

### Rename username

DHIS2 does not support renaming usernames directly. While it is possible to update usernames through the API, this only modifies the main table. References in other tables, which rely on the hardcoded username (not `userinfoid` or `userinfo.uid`), will remain unchanged.

To fully rename a username across all references, you need to execute a SQL script. Start by generating the script using the following command:

```shell
 yarn start users rename-username \
  --mapping=user1old:user1new,user2old:user2new \
  [--dry-run] --output=rename.sql
```

And then run the generated SQL script in your database to perform the actual renaming:

```shell
psql -U dhis dhis2 -f rename.sql
```

Replace `dhis` with your database username and `dhis2` with your database name if they differ. Ensure you have a backup of the database before applying the changes.

## User monitoring

### Users Permissions Fixer and 2FA Reporter

#### Execution:

```
yarn start usermonitoring run-permissions-fixer --config-file config.json
or
yarn start usermonitoring run-2fa-reporter --config-file config.json
```

#### Debug:

```shell
LOG_LEVEL=debug node --inspect-brk dist/index.js usermonitoring run-users-monitoring   --config-file config.json
LOG_LEVEL=debug node --inspect-brk dist/index.js usermonitoring run-2fa-reporter   --config-file config.json
```

#### Requirements:

A config json file to get the user/password and server:

```json
{
    "URL": {
        "username": "",
        "password": "",
        "server": "http://localhost:8080"
    }
}
```

#### run-2fa-reporter Datastore:

d2-tools -> two-factor-monitoring:

A push program variable with the id of the program in dhis

A two factor group to filter the users that should have two factor activated

The datastore must contain:

```json
{
    "pushProgram": {
        "id": "uid",
        "name": "push program"
    },
    "twoFactorGroup": {
        "id": "uid",
        "name": "Auth control group"
    }
}
```

#### run-users-monitoring Datastore:

d2-tools -> permission-fixer:

The datastore must contain:

A list of excluded_roles (could be an empty list [])

A list of excluded roles by group (could be an empty list [])

A list of excluded roles by role (could be an empty list [])

A list of excluded roles by user (could be an empty list [])

List of excluded users (the script will ignore them) (could be an empty list [])

A minimum group to add that group to the users without any template group (WIDP requirement)

A minimum role to add that role to the users without any role (DHIS requirement)
A pushProgram variable with the program ID to send the report

A list of templates (user with the valid roles, and group to identify which users could use those roles).

A list with flags to control the script (permissionFixerConfig).

The pushReport boolean variable determines whether the script should send the report after processing all users.

The pushFixedUserGroups boolean variable enables pushing fixed user groups for users who do not have a WIDP template user group.

The pushFixedUsersRoles boolean variable allows the pushing of fixed user roles.

The forceMinimalGroupForUsersWithoutGroup boolean variable determines how to handle users with invalid user groups. If set to true, it treats these users as if they are assigned to the minimal group without updating their user group. If set to false, it assigns the minimal group to users without a template user group on the server.

An example of the datastore:

Note: the names are used only to make easy understand and debug the keys.

```json
{
    "excludedRoles": [
        {
            "id": "uid",
            "name": "App - name"
        }
    ],
    "excludedRolesByGroup": [
        {
            "group": {
                "id": "uid",
                "name": "User group name"
            },
            "role": {
                "id": "hXY2OtVz70P",
                "name": "App - name"
            }
        }
    ],
    "excludedRolesByRole": [
        {
            "active_role": {
                "id": "uid",
                "name": "App present in the user"
            },
            "ignore_role": {
                "id": "uid",
                "name": "App to be ignored"
            }
        }
    ],
    "excludedRolesByUser": [
        {
            "role": {
                "id": "uid",
                "name": "App - name"
            },
            "user": {
                "id": "uid",
                "name": "username"
            }
        }
    ],
    "excludedUsers": [
        {
            "id": "uid",
            "name": "username"
        }
    ],
    "minimalGroup": {
        "id": "uid",
        "name": "Users"
    },
    "minimalRole": {
        "id": "uid",
        "name": "Role name"
    },
    "permissionFixerConfig": {
        "forceMinimalGroupForUsersWithoutGroup": true,
        "pushFixedUserGroups": false,
        "pushFixedUsersRoles": false,
        "pushReport": true
    },
    "pushProgram": {
        "id": "uid",
        "name": "Program name"
    },
    "templates": [
        {
            "group": {
                "id": "uid",
                "name": "user group name"
            },
            "template": {
                "id": "uid",
                "name": "user template username"
            }
        }
    ]
}
```

### Users Authorities Monitoring

#### Execution:

```shell
yarn start usermonitoring run-authorities-monitoring --config-file config.json

# To get the debug logs and store them in a file use:
LOG_LEVEL=debug yarn start usermonitoring run-authorities-monitoring --config-file config.json &> authorities-monitoring.log
```

#### Parameters:

-   `--config-file`: Connection and webhook config file.
-   `-s` | `--set-datastore`: Write users data to datastore, use in script setup. It assumes there is a monitoring config in d2-tools/authorities-monitor.

#### Requirements:

A config file with the access info of the server and the message webhook details:

```json
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

This reports stores data into the `d2-tools.authorities-monitor` datastore. This key needs to be setup before the first run to get a correct report.
It's possible to leave `usersByAuthority` empty and use the `-s` flag to populate it.

A sample:

```json
{
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

### User Groups Monitoring

This script will compare the metadata of the monitored userGroups with the version stored in the datastore and generate a report of the changes. This report will be sent to the MS Teams channel set in the webhook config section. Then the new version of the metadata will be stored in the datastore.

#### Execution:

```shell
yarn start usermonitoring run-user-groups-monitoring --config-file config.json

# To get the debug logs and store them in a file use:
LOG_LEVEL=debug yarn start usermonitoring run-user-groups-monitoring --config-file config.json &> user-groups-monitoring.log
```

#### Parameters:

-   `--config-file`: Connection and webhook config file.
-   `-s` | `--set-datastore`: Write usergroups data to datastore, use in script setup. It assumes there is a monitoring config in d2-tools/user-groups-monitoring.

#### Requirements:

A config file with the access info of the server and the message webhook details:

```json
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

This reports stores data into the `d2-tools.user-groups-monitoring` datastore. This key needs to be setup before the first run to get a correct report.
Its possible to leave `monitoredUserGroups` empty and use the `-s` flag to populate it.

The report, potentially, has tree sections for each user group:

-   New entries: JSON with the properties that were unset or empty and changed.
-   Modified fields: This section has two JSONs, one showing the old values and one with the news.
-   User assignment changes: This section will show the users lost and added to the group.

If a section is empty it will be omitted.

### User Templates Monitoring

The User Templates Monitoring script is used to compare user templates with the version stored in the datastore and generate a report of the changes. The report includes information on modified fields, and a detailed report on user groups and roles added or lost. This report will be sent to the MS Teams channel set in the webhook config section. The new version of the metadata will be stored in the datastore.

#### Execution:

```shell
yarn start usermonitoring run-user-templates-monitoring --config-file config.json

# To get the debug logs and store them in a file use:
LOG_LEVEL=debug yarn start usermonitoring run-user-templates-monitoring --config-file config.json &> user-templates-monitoring.log
```

#### Parameters:

-   `--config-file`: Connection and webhook config file.
-   `-s` | `--set-datastore`: Write user templates data to datastore, use in script setup. It assumes there is a monitoring config in d2-tools/user-templates-monitoring.

#### Requirements:

A config file with the access info of the server and the message webhook details:

```json
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

#### Report

This reports stores data into the `d2-tools.user-templates-monitoring` datastore. This key needs to be setup before the first run to get a correct report.

Its possible to leave `monitoredUserTemplates` empty and use the `-s` flag to populate it.

The report includes the following sections:

-   New entries: This section lists new properties that didn't exist in the old version.
-   Modified fields: This section shows the fields that have been modified in the user templates and shows the before/after values.
-   User Membership changes: This section displays the changes in the template userGroups and userRoles membership.

If a section is empty, it will be omitted from the report.

## Move Attributes from a Program

Get all the TEIS in the program and move the value from the attribute in the argument `--from-attribute-id` to the attribute `--to-attribute-id`. Then delete the value in `--from-attribute-id`.

```shell
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

```shell
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

```shell
yarn start indicators get-ref-ids \
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

```shell
yarn start indicators get-de-values-report \
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

## Tracked entities

### Transfer

Transfer tracked entities to another org unit, using a CSV as source data (expected columns: trackedEntityId, newOrgUnitId):

```shell
yarn start trackedEntities transfer \
  --url=http://localhost:8080 \
  --auth="USER:PASSWORD"  \
  --input-file=transfers.csv \
  --post
```

## Options

### rename

Rename an option code (options are the children of option sets). Actions:

-   metadata: rename the option code
-   metadata: recode the attribute values associated with the option (TODO)
-   data values: recode the associated code used as dataValues[].value
-   events: recode the associated code used as dataValues[].value
-   tracker: recode the associated tracked entity attributes (TODO)

```shell
yarn start options rename-code \
  --url=https://play.im.dhis2.org/stable-2-41-3 \
  --auth="admin:distrct"  \
   --id=YQe3PFbATvz \
  --to-code="NVP" \
  --post
```

## Data

## Get report

Generate a simple text report on console with info about dataValues/events/trackedEntities for some
org units branch (pass the parent orgunit ID):

```shell
yarn start data get-report \
    --url="https://play.im.dhis2.org/dev" \
    --auth="admin:district" \
    --orgunit-id="DiszpKrYNg8"
```

## Enrollments

### Close Enrollments with Events older than a date

Set the status to completed for all enrollments that satisfy the following criteria:

-   All their _events_ have an _event date_ older than the cut off date.
-   The _enrollment_ belong to the selected _organization unit_ and _program_.

The date can have either `YYYY-MM-DD` or `YYYY-MM-DDThh:mm:ss` format. If no time is specified 00:00:00 is used.

If some of the enrollments could not be closed their info is stored in a `close_errors_<timestamp>.json` file.

```console
shell:~$ yarn start enrollments close \
  --url 'http://USER:PASSWORD@localhost:8080' \
  --org-unit-id 'DiszpKrYNg8' \
  --program-id 'WCJhvPcJomX' \
  --event-date-before "2025-01-01T00:00:00"
```

To get the debug log use:

```console
shell:~$ LOG_LEVEL=debug yarn start enrollments close \
  --url 'http://USER:PASSWORD@localhost:8080' \
  --org-unit-id 'DiszpKrYNg8' \
  --program-id 'WCJhvPcJomX' \
  --event-date-before "2025-01-01T00:00:00"
```

## Category option combos

### Translations

Translate all the COCs for a specific category combo (if not specified, post for all)

```console
shell:~$ yarn start:dev categoryOptionCombos translate \
    --url=https://play.im.dhis2.org/dev \
    --auth="admin:district" \
    --category-combo-ids=v1K6CE6bmtw
    --post
```
