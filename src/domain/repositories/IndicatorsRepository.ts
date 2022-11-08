import { Indicator, indicatorDataRow } from "domain/entities/Indicator";
import { Id } from "types/d2-api";

export interface IndicatorsRepository {
    get(ids: Id[]): Promise<Indicator[]>;
    exportToCSV(metadata: indicatorDataRow[], path?: string): Promise<void>;
}
