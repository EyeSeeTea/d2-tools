import { LocaleCode } from "./Locale";

export interface Translation<Property extends string = string> {
    property: Property;
    locale: LocaleCode;
    value: string;
}
