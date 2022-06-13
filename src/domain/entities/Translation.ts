export interface Translation<Property extends string = string> {
    property: Property;
    locale: string;
    value: string;
}
