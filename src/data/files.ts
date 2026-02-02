import { writeFileSync } from "fs";
import * as psqlformat from 'psqlformat';

export function saveJsonToDisk(prefixFileName: string, contentFile: unknown): void {
    const currentDate = getCurrentDate();

    writeFileSync(`${prefixFileName}_${currentDate}.json`, JSON.stringify(contentFile, null, 2));
}

export function saveSqlToDisk(prefixFileName: string, sql: string): void {
    const currentDate = getCurrentDate();

    writeFileSync(`${prefixFileName}_${currentDate}.sql`, formatSql(sql));
}

function getCurrentDate(): string {
    return new Date().toISOString().replace("T", "_").replaceAll(":", "-").replaceAll(".", "-");
}


function formatSql(fullSql: string) {
    return psqlformat.formatSql(fullSql, {
        commaStart: false,
        commaEnd: true,
        commaBreak: false,
        formatType: true,
        noSpaceFunction: true,
    });
}
