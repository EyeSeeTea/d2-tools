import { Async } from "domain/entities/Async";
import { Path } from "domain/entities/Base";
import { DanglingDataValue } from "domain/entities/DanglingDataValue";
import { DataValuesMetadata } from "domain/entities/DataValue";

export interface DanglingDataValuesRepository {
    load(path: string): Async<DanglingDataValue[]>;

    save(options: {
        dataValues: DanglingDataValue[];
        dataValuesMetadata: DataValuesMetadata;
        outputFile: Path;
    }): Async<void>;
}
