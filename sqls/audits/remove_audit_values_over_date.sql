-- Set date remove audits older than 1 year
 select (CURRENT_DATE - interval '1 year')::date  AS oneyearago \gset

-- data value audits
START TRANSACTION;
SELECT CONCAT('Total data value audits as at ', NOW(), ' : ', COUNT(*)) AS "log_msg"
  FROM datavalueaudit
;

SELECT 'Removing data value audits over ' || :'oneyearago' AS "log_msg";
DELETE 
  FROM datavalueaudit
 WHERE created < TO_DATE(:'oneyearago', 'YYYY-MM-DD')
;

COMMIT;

-- tracked entity data value audits (event audits)
START TRANSACTION;
SELECT CONCAT('Total tracked entity data value audits as at ', NOW(), ' : ', COUNT(*))
  FROM trackedentitydatavalueaudit
;

SELECT 'Removing tracked entity data value audits over ' || :'oneyearago' AS "log_msg";
DELETE 
  FROM trackedentitydatavalueaudit
 WHERE created < TO_DATE(:'oneyearago', 'YYYY-MM-DD')
;

COMMIT;

-- TEA audits
START TRANSACTION;
SELECT CONCAT('Total tracked entity attribute value audits as at ', NOW(), ' : ', COUNT(*))
  FROM trackedentityattributevalueaudit
;

SELECT 'Removing tracked entity data value audits over ' || :'oneyearago' AS "log_msg";
DELETE 
  FROM trackedentityattributevalueaudit
 WHERE created < TO_DATE(:'oneyearago', 'YYYY-MM-DD')
;

COMMIT;

-- audit table
START TRANSACTION;
SELECT CONCAT('Total audit table entries at ', NOW(), ' : ', COUNT(*))
  FROM audit
;

SELECT 'Removing audit table entries over ' || :'oneyearago' AS "log_msg";
DELETE 
  FROM audit
 WHERE createdat < TO_DATE(:'oneyearago', 'YYYY-MM-DD')
;

COMMIT;