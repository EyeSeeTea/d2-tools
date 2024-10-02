import { Id } from "domain/entities/Base";

export interface IndicatorsRepository {
    get(ids: Id[]): Promise<Indicator[]>;
}

export interface Indicator {
    id: Id;
    name: string;
    numerator: string;
    numeratorDescription: string;
    denominator: string;
    denominatorDescription: string;
}
