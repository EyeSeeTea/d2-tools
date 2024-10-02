import { Translation } from "./Translation";

export type FieldTranslations = FieldTranslation[];

export interface FieldTranslation {
    model: string; // plural
    identifier: Partial<{ id: string; name: string; code: string }>;
    translations: Translation[];
}
