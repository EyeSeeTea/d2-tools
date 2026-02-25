import { Id } from "domain/entities/Base";

export interface CategoryOptionComboDeleteExporter {
    exportDeleteScript(cocIds: Id[]): void;
}
