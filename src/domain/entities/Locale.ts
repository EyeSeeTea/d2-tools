import { Id } from "./Base";
import { LocaleCode } from "./FieldTranslations";

export interface Locale {
    id: Id;
    name: string;
    locale: LocaleCode;
}
