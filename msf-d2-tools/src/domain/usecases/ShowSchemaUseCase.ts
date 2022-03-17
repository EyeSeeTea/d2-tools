import { DataSetsRepository } from "domain/repositories/DataSetsRepository";

export class ShowSchemaUseCase {
    constructor(private dataSetsRepository: DataSetsRepository) {}

    execute(): void {
        const schema = this.dataSetsRepository.getSchema();
        console.info(JSON.stringify(schema, null, 4));
    }
}
