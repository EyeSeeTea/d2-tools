-- audit table
-- Deletes datavalueaudit data generated by Data_Quality user
START TRANSACTION;

SELECT
    'Deletes datavalueaudit data generated by Data_Quality user' AS "log_msg";

DELETE FROM
    datavalueaudit
WHERE
    modifiedby = 'Data_Quality';

COMMIT;

-- Deletes duplicated audit data 
START TRANSACTION;

SELECT
    'Removing duplicated datavalueaudit table entries' AS "log_msg";

WITH marked_duplicates AS (
    SELECT
        datavalueauditid as id,
        LAG(datavalueauditid) OVER (
            PARTITION BY dataelementid,
            periodid,
            organisationunitid,
            categoryoptioncomboid,
            attributeoptioncomboid,
            value,
            audittype
            ORDER BY
                dataelementid,
                periodid,
                organisationunitid,
                categoryoptioncomboid,
                attributeoptioncomboid,
                value,
                audittype
        ) as prev_id
    FROM
        datavalueaudit
)
DELETE FROM
    datavalueaudit
WHERE
    datavalueauditid IN (
        SELECT
            id
        FROM
            marked_duplicates
        WHERE
            prev_id IS NOT NULL
    );