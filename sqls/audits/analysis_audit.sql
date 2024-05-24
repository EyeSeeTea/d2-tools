-- CSV output format
\f ','
\a

-- CHANGE THIS to desired ranges
\set StartDate '2023-10-01'
\set EndDate '2023-10-02'

\set DetailStartDate '2023-12-14 00:00:00.000'
\set DetailEndDate '2023-12-14 13:00:00.000'


-- Entries in audit and datavalue table by day, audit split by auditscope
-- Manually combine these two queries
SELECT
    DATE(createdat) AS day,
    SUM(CASE WHEN auditscope = 'AGGREGATE' THEN 1 END) AS "AGGREGATE_count",
    SUM(CASE WHEN auditscope = 'METADATA' THEN 1 END) AS "METADATA_count",
    SUM(CASE WHEN auditscope = 'TRACKER' THEN 1 END) AS "TRACKER_count"
FROM
    audit
WHERE DATE(createdat) BETWEEN :'StartDate' AND :'EndDate'
GROUP BY day;

SELECT 
    DATE(created) AS day, 
    count(*) AS "datavalue_count" 
FROM 
    datavalue 
WHERE created BETWEEN :'StartDate' AND :'EndDate' 
GROUP BY day;


-- audit entries by metadata type and hour
SELECT
    DATE_TRUNC('hour', createdat) AS hour,
    substring(klass FROM 'org\.hisp\.dhis\.(.*)') AS metadata_type,
    count(*) as cnt
FROM
    audit
WHERE
    createdat BETWEEN :'DetailStartDate' AND :'DetailEndDate'
GROUP BY
    hour,
    klass
\crosstabview hour metadata_type cnt;



-- datavalue by user and hour
SELECT
    DATE_TRUNC('hour', created) AS hour,
    storedby,
    count(*) AS cnt
FROM
    datavalue
WHERE
    created BETWEEN :'DetailStartDate' AND :'DetailEndDate'
GROUP BY
    hour,
    storedby
\crosstabview hour storedby cnt;



-- Datavalue sample, set limit value and storedby as needed
SELECT *
FROM (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY storedby ORDER BY created) AS rn
    FROM
        datavalue
    WHERE
        created BETWEEN :'DetailStartDate' AND :'DetailEndDate'
        AND (
            storedby LIKE 'XXX'
            OR storedby LIKE 'YYY'
        )
) AS subquery
WHERE
    rn <= 30;
