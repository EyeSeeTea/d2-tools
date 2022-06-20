import _ from "lodash";
import isoLanguageCodes from "iso-language-codes";

import { Async } from "domain/entities/Async";
import { FieldTranslations, LanguageCodeIso839_1 } from "domain/entities/FieldTranslations";
import {
    FieldTranslationsRepository,
    GetFieldTranslationsOptions,
} from "domain/repositories/FieldTranslationsRepository";
import { SpreadsheetXlsxDataSource } from "domain/repositories/SpreadsheetXlsxRepository";
import log from "utils/log";
import { Sheet } from "./SpreadsheetsDataSource";

export class FieldTranslationsSpreadsheetRepository implements FieldTranslationsRepository {
    async get<Field extends string>(
        options: GetFieldTranslationsOptions<Field>
    ): Async<FieldTranslations<Field>[]> {
        const { translatableField, inputFile, skipHeaders } = options;
        const spreadsheet = await new SpreadsheetXlsxDataSource().read({ inputFile, skipHidden: false });

        const fieldTranslations = _(spreadsheet.sheets)
            .flatMap((sheet): Array<FieldTranslations<Field>> => {
                // Get headers from first row and create the locale mapping.
                const referenceRow = _.first(sheet.rows);
                const headers = _.keys(referenceRow);
                const locales = _.difference(headers, [identifierField, translatableField, ...skipHeaders]);
                if (!referenceRow) return [];

                const localeMapping: Record<string, LanguageCodeIso839_1> = this.getLocaleMapping(locales);
                return this.getFieldTranslationsFromSheet<Field>(sheet, localeMapping, options);
            })
            .value();

        return _.compact(fieldTranslations);
    }

    private getFieldTranslationsFromSheet<Field extends string>(
        sheet: Sheet<string>,
        localeMapping: Record<string, LanguageCodeIso839_1>,
        options: GetFieldTranslationsOptions<Field>
    ): Array<FieldTranslations<Field>> {
        const { translatableField, skipHeaders, countryMapping } = options;

        const translations = sheet.rows.map((row, idx) => {
            const headers = _.keys(row);
            const locales = _.difference(headers, [identifierField, translatableField, ...skipHeaders]);
            const identifier = row[identifierField];
            const fieldValue = row[translatableField];
            const rowStr = JSON.stringify(row);
            const notFoundMsg = `not found in ${sheet.name}:${idx}: ${rowStr}`;

            if (!identifier) {
                log.warn(`Identifier field (${identifierField}) ${notFoundMsg}`);
                return;
            } else if (!fieldValue) {
                log.warn(`Field ${translatableField} ${notFoundMsg}`);
                return;
            }

            const translations: FieldTranslations<Field>["translations"] = _(locales)
                .map(locale => {
                    const localeCode = localeMapping[locale];
                    const value = row[locale];
                    const countryCode = localeCode ? countryMapping[localeCode] : undefined;
                    return localeCode && value
                        ? { locale: _([localeCode, countryCode]).compact().join("_"), value }
                        : undefined;
                })
                .compact()
                .value();

            const fieldTranslation: FieldTranslations<Field> = {
                identifier: identifier,
                field: translatableField,
                value: fieldValue,
                translations,
            };

            return fieldTranslation;
        });

        return _.compact(translations);
    }

    private getLocaleMapping(locales: string[]): Record<string, string> {
        return _(locales)
            .map(locale => {
                const isoCode = isoLanguageCodesByName[locale];

                if (!isoCode) {
                    log.warn(`Unknown locale name: ${locale}`);
                } else {
                    return [locale, isoCode.iso639_1] as [string, LanguageCodeIso839_1];
                }
            })
            .compact()
            .fromPairs()
            .value();
    }
}

const identifierField = "name";

// Locale names can be comma-separated: split in different entries
const isoLanguageCodesByName = _(isoLanguageCodes)
    .flatMap(code => code.name.split(",").map(name => [name, code]))
    .fromPairs()
    .value();
