-- audit table
START TRANSACTION;

SELECT 'Removing duplicated audit table entries' AS "log_msg";

DELETE FROM audit a USING audit b
WHERE
  a.auditscope = 'AGGREGATE'
  AND b.auditscope = 'AGGREGATE'
  AND a.ctid < b.ctid
  AND (
    a.audittype,
    a.auditscope,
    a.klass,
    a.attributes,
    a.data
  ) = (
    b.audittype,
    b.auditscope,
    b.klass,
    b.attributes,
    b.data
  );

COMMIT;