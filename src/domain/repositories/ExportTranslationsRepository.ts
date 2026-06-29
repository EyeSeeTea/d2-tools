import { Async } from "domain/entities/Async";
import { ModelTranslationsExport } from "domain/entities/ModelTranslationsExport";

export interface ExportTranslationsRepository {
    save(options: ExportTranslationsOptions): Async<void>;
}

export interface ExportTranslationsOptions {
    outputFile: string;
    sheets: ModelTranslationsExport[]; // one per model
    includeData: boolean; // false => header row only; true => full rows (source + translations)
}
