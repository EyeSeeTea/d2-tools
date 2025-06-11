import { writeFileSync } from "fs";

export function saveJsonToDisk(prefixFileName: string, contentFile: unknown): void {
    const currentDate = new Date().toISOString().replace("T", "_").replaceAll(":", "-").replaceAll(".", "-");

    writeFileSync(`${prefixFileName}_${currentDate}.json`, JSON.stringify(contentFile, null, 2));
}
