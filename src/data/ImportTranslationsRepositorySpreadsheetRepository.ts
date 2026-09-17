import _ from "lodash";
import { Async } from "domain/entities/Async";
import { FieldTranslation, FieldTranslations, FieldValues } from "domain/entities/FieldTranslations";
import {
    ImportTranslationsRepository,
    GetFieldTranslationsOptions,
} from "domain/repositories/ImportTranslationsRepository";
import { SpreadsheetXlsxDataSource } from "domain/repositories/SpreadsheetXlsxRepository";
import log from "utils/log";
import { Maybe } from "utils/ts-utils";
import { getPluralModel } from "./dhis2-utils";
import { Translation, translationFieldToProperty } from "domain/entities/Translation";
import { getLocaleInfo, LocaleCode } from "domain/entities/Locale";

const columnsMapping = {
    id: ["id", "uid"],
    type: ["type", "kind"],
    name: ["name"],
    code: ["code"],
};

/* Spreadsheet with columns:

    - type/kind: model (singular) -> example: dataElement
    - id/uid
    - code
    - name
    - FIELD1 -> updates the object field itself (example: formName)
    - FIELD1: LANGUAGE_NAME1 -> updates the translation
    - FIELD2: LANGUAGE_NAME2
    - ...

    Spreadsheets starting with '!' will be skipped.

    Columns of the default locale (option --default-locale) also update the object field itself,
    on top of its translation.
*/
export class ImportTranslationsRepositorySpreadsheetRepository implements ImportTranslationsRepository {
    async get(options: GetFieldTranslationsOptions): Async<FieldTranslations> {
        const { inputFile } = options;
        const spreadsheet = await new SpreadsheetXlsxDataSource().read({ inputFile, skipHidden: false });

        return _(spreadsheet.sheets)
            .reject(sheet => sheet.name.startsWith("!"))
            .flatMap((sheet): FieldTranslations => {
                const fieldTranslations = _(sheet.rows)
                    .map((row, rowIndex) => this.fromRow(row, rowIndex, `${sheet.name}:${rowIndex}`, options))
                    .compact()
                    .value();
                log.info(`Sheet '${sheet.name}': ${fieldTranslations.length} rows parsed`);
                return fieldTranslations;
            })

            .value();
    }

    private fromRow(
        row: Row,
        rowIndex: number,
        rowInfo: string,
        options: GetFieldTranslationsOptions
    ): Maybe<FieldTranslation> {
        const { locales } = options;
        const isFirstRow = rowIndex === 0;
        const warn = (msg: string) => log.warn(`[${rowInfo}]: ${msg}`);

        const identifier = {
            id: this.getHeaderValue(row, "id"),
            name: this.getHeaderValue(row, "name"),
            code: this.getHeaderValue(row, "code"),
        };

        const model = this.getHeaderValue(row, "type");
        const someIdentifierWithValue = _(identifier).values().some();
        const localesByName = _.keyBy(locales, locale => locale.name.replace(/\s*\(.*\)$/, ""));

        if (!model) {
            warn(`No model kind/type found, add the column`);
            return undefined;
        } else if (!someIdentifierWithValue) {
            warn(`No identifier found, should specify at least one of: id, name, code`);
            return undefined;
        }

        const translationColumns = _(row)
            .keys()
            .filter(column => column.includes(":"))
            .value();

        const entries = _(translationColumns)
            .flatMap(translationColumn => {
                const [fields = "", localeName] = translationColumn.split(":").map(s => s.trim());

                return fields
                    .split(",")
                    .map(s => s.trim())
                    .map((field): Maybe<ColumnEntry> => {
                        const locale = localeName ? localesByName[localeName] : undefined;
                        const text = row[translationColumn];

                        if (!(field && text)) {
                            warn(`Translation property/text parsing failed`);
                            return undefined;
                        } else if (!locale) {
                            if (isFirstRow) warn(`Locale not found in DB: name=${localeName}`);
                            return undefined;
                        } else {
                            const property = translationFieldToProperty(field);
                            const translation = { property: property, locale: locale.locale, value: text };
                            // A default-locale column also updates the object field itself, so both
                            // the field and its translation stay in sync.
                            const isDefault = isDefaultLocale(locale.locale, options.defaultLocale);
                            const fieldValue = isDefault ? { [_.camelCase(field)]: text } : undefined;
                            return { translation, fieldValue };
                        }
                    });
            })
            .compact()
            .value();

        const translations = entries.map(entry => entry.translation);
        const pluralModel = getPluralModel(model);
        const bareFieldValues = this.getBareFieldValues(row, pluralModel, identifier, options);

        // An explicit default-locale column wins over the bare column of the same field.
        const fieldValues: FieldValues = Object.assign(
            {},
            bareFieldValues,
            ...entries.map(entry => entry.fieldValue)
        );

        return { model: pluralModel, identifier: identifier, translations, fields: fieldValues };
    }

    /* A bare column (no locale) named exactly as a translatable field of the model writes that
       field. The name column doubles as the lookup key: it's written only when the row also has
       an id or code, otherwise a case-insensitive lookup match would rename the object. */
    private getBareFieldValues(
        row: Row,
        model: string,
        identifier: Identifier,
        options: GetFieldTranslationsOptions
    ): FieldValues {
        const translatableFields = options.translatableFields[model] ?? [];
        const identifierColumns = _.flatMap(columnsMapping);
        const hasIdOrCode = Boolean(identifier.id || identifier.code);

        return _(row)
            .toPairs()
            .reject(([column]) => column.includes(":"))
            .reject(([column]) =>
                column === "name" ? !hasIdOrCode : identifierColumns.includes(column.toLowerCase())
            )
            .filter(([column, text]) => (translatableFields.includes(column) ? Boolean(text) : false))
            .fromPairs()
            .value();
    }

    private getHeaderValue(row: Row, column: ColumnsMappingKey): Maybe<string> {
        const row2 = _.mapKeys(row, (_value, column) => column.toLowerCase());

        return _(columnsMapping[column])
            .map(column => row2[column.toLowerCase()])
            .compact()
            .first();
    }
}

type Row = Record<string, string>;

type Identifier = FieldTranslation["identifier"];

type ColumnsMappingKey = keyof typeof columnsMapping;

interface ColumnEntry {
    translation: Translation;
    fieldValue: Maybe<FieldValues>;
}

/* Locales may be LANGUAGE or LANGUAGE_COUNTRY: compare only the language part, so a
   --default-locale=en also matches a column mapped to en_GB. */
function isDefaultLocale(locale: LocaleCode, defaultLocale: Maybe<LocaleCode>): boolean {
    if (!defaultLocale) return false;
    return getLocaleInfo(locale).language === getLocaleInfo(defaultLocale).language;
}
