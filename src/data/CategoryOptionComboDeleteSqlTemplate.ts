export const deleteCategoryOptionComboBatchSqlTemplate = `CREATE TEMP TABLE temp_uids_batch (uid VARCHAR(11));
INSERT INTO temp_uids_batch (uid) VALUES
  <%= valuesClause %>;

CREATE TEMP TABLE temp_ids_batch AS
SELECT coc.categoryoptioncomboid
FROM categoryoptioncombo coc
INNER JOIN temp_uids_batch t ON t.uid = coc.uid
WHERE NOT EXISTS (
    SELECT 1 FROM datavalue dv
    WHERE dv.categoryoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM datavalue dv
    WHERE dv.attributeoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM datavalueaudit dva
    WHERE dva.categoryoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM datavalueaudit dva
    WHERE dva.attributeoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM dataelementoperand deo
    WHERE deo.categoryoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM completedatasetregistration csdr
    WHERE csdr.attributeoptioncomboid = coc.categoryoptioncomboid
  )
  AND NOT EXISTS (
    SELECT 1 FROM datadimensionitem ddi
    WHERE ddi.dataelementoperand_categoryoptioncomboid = coc.categoryoptioncomboid
  );

DELETE FROM categoryoptioncombos_categoryoptions
WHERE categoryoptioncomboid IN (SELECT categoryoptioncomboid FROM temp_ids_batch);

DELETE FROM categorycombos_optioncombos
WHERE categoryoptioncomboid IN (SELECT categoryoptioncomboid FROM temp_ids_batch);

DELETE FROM categoryoptioncombo
WHERE categoryoptioncomboid IN (SELECT categoryoptioncomboid FROM temp_ids_batch);

DROP TABLE temp_uids_batch;
DROP TABLE temp_ids_batch;`;
