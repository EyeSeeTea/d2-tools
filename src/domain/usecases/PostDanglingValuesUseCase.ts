import _ from "lodash";

import { Path } from "domain/entities/Base";
import { DataValuesRepository } from "domain/repositories/DataValuesRepository";
import { DataValueToPost } from "domain/entities/DataValue";
import log from "utils/log";
import { DanglingDataValuesRepository } from "domain/repositories/DanglingDataValuesRepository";

interface Options {
    inputFile: Path;
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
        log.debug(`Post data values: ${dataValues.length}`);
        await this.dataValuesRepository.post({ dataValues });
    }
}
