-- audit table

-- Deletes datavalueaudit data generated by Data_Quality user
START TRANSACTION;
SELECT 'Deletes datavalueaudit data generated by Data_Quality user' AS "log_msg";
DELETE FROM datavalueaudit WHERE modifiedby = 'Data_Quality'; 
COMMIT;


-- Deletes duplicated audit data 
START TRANSACTION;

SELECT 'Removing duplicated datavalueaudit table entries' AS "log_msg";

DELETE FROM datavalueaudit a USING datavalueaudit b
WHERE
    a.ctid < b.ctid
    AND (
        a.dataelementid,
        a.periodid,
        a.organisationunitid,
        a.categoryoptioncomboid,
        a.attributeoptioncomboid,
        a.value,
		a.modifiedby,
		a.audittype
    ) = (
        b.dataelementid,
        b.periodid,
        b.organisationunitid,
        b.categoryoptioncomboid,
        b.attributeoptioncomboid,
        b.value,
		b.modifiedby,
		b.audittype
    );

COMMIT;