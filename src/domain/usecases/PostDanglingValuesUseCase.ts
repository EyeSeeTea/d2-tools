import _ from "lodash";
import fs from "fs";

import { Path } from "domain/entities/Base";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { DataValueToPost } from "domain/entities/DataValue";
import log from "utils/log";
import { DanglingDataValuesRepository } from "domain/repositories/DanglingDataValuesRepository";

interface Options {
    url: string;
    inputFile: Path;
    savePayload?: Path;
}

export class PostDanglingValuesUseCase {
    constructor(
        private dataValuesRepository: DataValuesRepository,
        private danglingDataValuesRepository: DanglingDataValuesRepository
    ) {}

    async execute(options: Options) {
        log.debug(`Read file: ${options.inputFile}`);
        const danglingDataValues = await this.danglingDataValuesRepository.load(options.inputFile);
        log.debug(`Dangling data values: ${danglingDataValues.length}`);
        const dataValues = danglingDataValues.map((danglingDataValue): DataValueToPost => {
            const { dataValue } = danglingDataValue;
            return { ...dataValue, deleted: true };
        });
        const outputFile = options.savePayload;

        if (options.savePayload) {
            const payload = { dataValues };
            const json = JSON.stringify(payload, null, 4);
            fs.writeFileSync(options.savePayload, json);
            log.info(`Written payload (${dataValues.length} data values): ${outputFile}`);
            const postUrl = `${options.url}/api/dataValueSets?force=true`;
            const msg = `Post: curl -H 'Content-Type:application/json' -d@'${outputFile}' '${postUrl}'`;
            log.info(msg);
        } else {
            log.debug(`Post data values: ${dataValues.length}`);
            await this.dataValuesRepository.post({ dataValues });
        }
    }
}
