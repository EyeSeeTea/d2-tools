import { Async } from "domain/entities/Async";
import { Path } from "domain/entities/Base";
import { DanglingDataValue } from "domain/entities/DanglingDataValue";

export interface DanglingDataValuesRepository {
    load(path: string): Async<DanglingDataValue[]>;
    save(options: { dataValues: DanglingDataValue[]; outputFile: Path }): Async<void>;
}
