import { CompareResult } from "domain/entities/CompareResult";
import { DataSetsRepository } from "domain/repositories/DataSetsRepository";
import { Id } from "types/d2-api";

export class ShowDataSetsDiffUseCase {
    constructor(private dataSetsRepository: DataSetsRepository) {}

    async execute(options: {
        dataSetIdsPairs: Array<[Id, Id]>;
        ignoreProperties: string[] | undefined;
    }): Promise<CompareResult[]> {
        if (options.ignoreProperties)
            console.debug(`Ignored properties: ${options.ignoreProperties.join(", ")}`);

        const results: CompareResult[] = [];

        for (const pair of options.dataSetIdsPairs) {
            const [id1, id2] = pair;
            const result = await this.dataSetsRepository.compare(id1, id2, options);
            const idsText = `${id1} - ${id2}:`;

            switch (result.type) {
                case "equal":
                    console.info(`${idsText} equal`);
                    break;
                case "non-equal":
                    console.info(`${idsText} non-equal\n` + result.diff);
                    break;
            }

            results.push(result);
        }

        return results;
    }
}
