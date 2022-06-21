import { LocaleCode } from "./Locale";

export interface FieldTranslations<Field extends string> {
    identifier: string;
    field: Field;
    value: string;
    translations: Array<{ locale: LocaleCode; value: string }>;
}
