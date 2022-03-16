import { DataSetsRepository } from "domain/repositories/DataSetsRepository";

export class ShowDataSetsDiffUseCase {
    constructor(private dataSetsRepository: DataSetsRepository) {}

    async execute(options: { dataSetIdsPairs: string[] }) {
        for (const pair of options.dataSetIdsPairs) {
            const [id1, id2] = pair.split("-");
            if (!id1 || !id2) throw new Error(`Invalid pair: ${pair} (expected ID1-ID2)`);

            const result = await this.dataSetsRepository.compare(id1, id2);
            const base = `${id1} <-> ${id2}`;

            switch (result.type) {
                case "equal":
                    console.log(`${base} Equal`);
                    break;
                case "non-equal":
                    console.log(`${base} Non equal:\n` + result.diff);
            }
        }
    }
}
