-- Functions
--
-- Rename plain string username in 'table_name.column_name'
CREATE OR REPLACE FUNCTION _update_username_string(table_name TEXT, column_name TEXT) RETURNS VOID AS $$
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
-- Rename plain string username in aggregated data values if dataElement.valuetype is 'USERNAME'
CREATE OR REPLACE FUNCTION _update_username_values() RETURNS VOID AS $$
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
-- Update string username in events data values if dataElement.valuetype is 'USERNAME'
CREATE OR REPLACE FUNCTION _update_event_datavalues() RETURNS VOID AS $$
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
-- Update tracked entity attributes values if the dataElement valuetype is 'USERNAME'
CREATE OR REPLACE FUNCTION _update_tracked_entity_attributes_values() RETURNS VOID AS $$
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
-- Rename username in JSONB table_name.column_name (key: "username")
CREATE OR REPLACE FUNCTION _update_username_jsonb(table_name TEXT, column_name TEXT) RETURNS VOID AS $$
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
RAISE NOTICE '%.%[username]: %',
table_name,
column_name,
rows_updated;
END;
$$ LANGUAGE plpgsql;
--
-- Actions
--
SELECT _update_username_string('audit', 'createdby');
SELECT _update_username_string('completedatasetregistration', 'lastupdatedby');
SELECT _update_username_string('completedatasetregistration', 'storedby');
SELECT _update_username_string('datastatisticsevent', 'username');
SELECT _update_username_string('datavalue', 'storedby');
SELECT _update_username_string('datavalueaudit', 'modifiedby');
SELECT _update_username_string('deletedobject', 'deleted_by');
SELECT _update_username_string('externalnotificationlogentry', 'triggerby');
SELECT _update_username_string('potentialduplicate', 'createdbyusername');
SELECT _update_username_string('potentialduplicate', 'lastupdatebyusername');
SELECT _update_username_string('programinstance', 'completedby');
SELECT _update_username_jsonb('programinstance', 'createdbyuserinfo');
SELECT _update_username_jsonb('programinstance', 'lastupdatedbyuserinfo');
SELECT _update_username_string('programinstance', 'storedby');
SELECT _update_username_string('programownershiphistory', 'createdby');
SELECT _update_username_string('programstageinstance', 'completedby');
SELECT _update_username_jsonb('programstageinstance', 'createdbyuserinfo');
SELECT _update_username_jsonb('programstageinstance', 'lastupdatedbyuserinfo');
SELECT _update_username_string('programstageinstance', 'storedby');
SELECT _update_username_string('programtempownershipaudit', 'accessedby');
SELECT _update_username_string('trackedentityattributevalue', 'storedby');
SELECT _update_username_string('trackedentityattributevalueaudit', 'modifiedby');
SELECT _update_username_string('trackedentitydatavalueaudit', 'modifiedby');
SELECT _update_username_jsonb('trackedentityinstance', 'createdbyuserinfo');
SELECT _update_username_jsonb('trackedentityinstance', 'lastupdatedbyuserinfo');
SELECT _update_username_string('trackedentityinstance', 'storedby');
SELECT _update_username_string('trackedentityinstanceaudit', 'accessedby');
SELECT _update_username_string('trackedentityprogramowner', 'createdby');
SELECT _update_username_string('userinfo', 'username');
SELECT _update_username_values();
SELECT _update_event_datavalues();
SELECT _update_tracked_entity_attributes_values();
-- Delete all functions
SELECT pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
    p.proname AS function_name,
    n.nspname AS schema_name
FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '_update_%';
