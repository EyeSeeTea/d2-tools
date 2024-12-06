-- Functions
CREATE OR REPLACE FUNCTION update_username_string(table_name TEXT, column_name TEXT) RETURNS VOID AS $$
DECLARE rows_updated INTEGER;
BEGIN EXECUTE format(
    'UPDATE %I
         SET %I = username_mapping.new_username
         FROM username_mapping
         WHERE %I.%I = username_mapping.old_username',
    table_name,
    column_name,
    table_name,
    column_name
);
GET DIAGNOSTICS rows_updated = ROW_COUNT;
RAISE NOTICE '%.%: %',
table_name,
column_name,
rows_updated;
END;
$$ LANGUAGE plpgsql;
--
CREATE OR REPLACE FUNCTION update_username_values() RETURNS VOID AS $$
DECLARE rows_updated INTEGER;
BEGIN
UPDATE datavalue dv
SET value = username_mapping.new_username
FROM username_mapping,
    dataelement de
WHERE dv.dataelementid = de.dataelementid
    AND de.valuetype = 'USERNAME'
    AND dv.value = username_mapping.old_username;
GET DIAGNOSTICS rows_updated = ROW_COUNT;
RAISE NOTICE 'datavalue.value[dataelement.type="USERNAME"]: %',
rows_updated;
END;
$$ LANGUAGE plpgsql;
---
CREATE OR REPLACE FUNCTION update_event_datavalues() RETURNS VOID AS $$
DECLARE rows_updated INTEGER;
BEGIN
UPDATE programstageinstance
SET eventdatavalues = jsonb_set(
        eventdatavalues,
        array [de.uid, 'value'],
        to_jsonb(um.new_username::text)
    )
FROM dataelement de,
    username_mapping um
WHERE de.valuetype = 'USERNAME'
    AND programstageinstance.eventdatavalues->de.uid->>'value' = um.old_username;
GET DIAGNOSTICS rows_updated = ROW_COUNT;
RAISE NOTICE 'programstageinstance.eventdatavalues[dataelement.type="USERNAME"]: %',
rows_updated;
END;
$$ LANGUAGE plpgsql;
--
CREATE OR REPLACE FUNCTION update_tracked_entity_attributes_values() RETURNS VOID AS $$
DECLARE rows_updated INTEGER;
BEGIN WITH updated_values AS (
    SELECT teav.trackedentityattributeid,
        username_mapping.new_username
    FROM trackedentityattributevalue teav
        JOIN trackedentityattribute tea ON teav.trackedentityattributeid = tea.trackedentityattributeid
        JOIN username_mapping ON teav.value = username_mapping.old_username
    WHERE tea.valuetype = 'USERNAME'
)
UPDATE trackedentityattributevalue teav
SET value = updated_values.new_username
FROM updated_values
WHERE teav.trackedentityattributeid = updated_values.trackedentityattributeid;
GET DIAGNOSTICS rows_updated = ROW_COUNT;
RAISE NOTICE 'trackedentityattributevalue.value[trackedentityattribute.type="USERNAME"]: %',
rows_updated;
END;
$$ LANGUAGE plpgsql;
--
CREATE OR REPLACE FUNCTION update_username_jsonb(
table_name TEXT,
column_name TEXT
) RETURNS VOID AS $$
DECLARE rows_updated INTEGER;
BEGIN EXECUTE format(
    'UPDATE %I
         SET %I = jsonb_set(%I, ''{username}'', to_jsonb(username_mapping.new_username::TEXT), true)
         FROM username_mapping
         WHERE %I->>''username'' = username_mapping.old_username',
    table_name,
    column_name,
    column_name,
    column_name
);
GET DIAGNOSTICS rows_updated = ROW_COUNT;
RAISE NOTICE '%.%[username]: % rows updated',
table_name,
column_name,
rows_updated;
END;
$$ LANGUAGE plpgsql;
-- Actions
SELECT update_username_string('completedatasetregistration', 'lastupdatedby');
SELECT update_username_string('completedatasetregistration', 'storedby');
SELECT update_username_string('datastatisticsevent', 'username');
SELECT update_username_string('datavalue', 'storedby');
SELECT update_username_string('deletedobject', 'deleted_by');
SELECT update_username_string('externalnotificationlogentry', 'triggerby');
SELECT update_username_string('potentialduplicate', 'createdbyusername');
SELECT update_username_string('potentialduplicate', 'lastupdatebyusername');
SELECT update_username_string('programinstance', 'completedby');
SELECT update_username_jsonb('programinstance', 'createdbyuserinfo');
SELECT update_username_jsonb('programinstance', 'lastupdatedbyuserinfo');
SELECT update_username_string('programinstance', 'storedby');
SELECT update_username_string('programownershiphistory', 'createdby');
SELECT update_username_string('programstageinstance', 'completedby');
SELECT update_username_jsonb('programstageinstance', 'createdbyuserinfo');
SELECT update_username_jsonb('programstageinstance', 'lastupdatedbyuserinfo');
SELECT update_username_string('programstageinstance', 'storedby');
SELECT update_username_string('programtempownershipaudit', 'accessedby');
SELECT update_username_string('trackedentityattributevalue', 'storedby');
SELECT update_username_string('trackedentityattributevalueaudit', 'modifiedby');
SELECT update_username_string('trackedentitydatavalueaudit', 'modifiedby');
SELECT update_username_jsonb('trackedentityinstance', 'createdbyuserinfo');
SELECT update_username_jsonb('trackedentityinstance', 'lastupdatedbyuserinfo');
SELECT update_username_string('trackedentityinstance', 'storedby');
SELECT update_username_string('trackedentityinstanceaudit', 'accessedby');
SELECT update_username_string('trackedentityprogramowner', 'createdby');
SELECT update_username_string('userinfo', 'username');
SELECT update_username_values();
SELECT update_event_datavalues();
SELECT update_tracked_entity_attributes_values();
