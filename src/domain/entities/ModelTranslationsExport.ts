import { Locale } from "./Locale";
import { MetadataObjectWithTranslations } from "./MetadataObject";

export interface ModelTranslationsExport {
    model: string; // plural, e.g. "dataElements"
    fields: string[]; // e.g. ["name", "formName"]
    locales: Locale[]; // column locales
    objects: MetadataObjectWithTranslations[];
}
