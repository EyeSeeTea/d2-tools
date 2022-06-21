import _ from "lodash";
import isoLanguageCodes from "iso-language-codes";

import { Async } from "domain/entities/Async";
import { FieldTranslations } from "domain/entities/FieldTranslations";
import {
    FieldTranslationsRepository,
    GetFieldTranslationsOptions,
} from "domain/repositories/FieldTranslationsRepository";
import { SpreadsheetXlsxDataSource } from "domain/repositories/SpreadsheetXlsxRepository";
import log from "utils/log";
import { Row } from "./SpreadsheetsDataSource";
import { getLocaleInfo, LanguageCodeIso839_1 } from "domain/entities/Locale";

const isoCodes = new Set(isoLanguageCodes.map(code => code.iso639_1));

export class FieldTranslationsSpreadsheetRepository implements FieldTranslationsRepository {
    async get<Field extends string>(
        options: GetFieldTranslationsOptions<Field>
    ): Async<FieldTranslations<Field>[]> {
        const { translatableField, inputFile, skipHeaders } = options;
        const spreadsheet = await new SpreadsheetXlsxDataSource().read({ inputFile, skipHidden: false });

        return _(spreadsheet.sheets)
            .flatMap((sheet): Array<FieldTranslations<Field>> => {
                // Get headers from first row and create the locale mapping.
                const referenceRow = _.first(sheet.rows);
                const headers = _.keys(referenceRow);
                const locales = _.difference(headers, [identifierField, translatableField, ...skipHeaders]);
                if (!referenceRow) {
                    log.debug(`Empty sheet: ${sheet.name}`);
                    return [];
                }

                const localeMapping: Record<string, LanguageCodeIso839_1> = this.getLocaleMapping(locales);

                return _(sheet.rows)
                    .map((row, rowIndex) =>
                        this.fromRow<Field>(row, `${sheet.name}:${rowIndex}`, locales, localeMapping, options)
                    )
                    .compact()
                    .value();
            })
            .value();
    }

    private fromRow<Field extends string>(
        row: Row<string>,
        rowInfo: string,
        locales: string[],
        localeMapping: Record<string, LanguageCodeIso839_1>,
        options: GetFieldTranslationsOptions<Field>
    ): FieldTranslations<Field> | undefined {
        const { translatableField, locales: existingLocales } = options;
        const identifier = row[identifierField];
        const fieldValue = row[translatableField];
        const warn = (msg: string) => log.warn(`[${rowInfo}]: ${msg}`);

        if (!identifier) {
            warn(`Identifier field (${identifierField}) not found`);
            return;
        } else if (!fieldValue) {
            warn(`Field ${translatableField} not found`);
            return;
        }

        const translations: FieldTranslations<Field>["translations"] = _(locales)
            .flatMap(locale => {
                const localeCode = localeMapping[locale];
                const value = row[locale];
                const getLang = (locale: string) => getLocaleInfo(locale).language;

                const existingLocalesForLocale = existingLocales.filter(existingLocale => {
                    return localeCode && getLang(existingLocale) === getLang(localeCode);
                });

                if (!localeCode) {
                    return [];
                } else if (_(existingLocalesForLocale).isEmpty()) {
                    warn(`Locale in source data but not in server: ${locale} / ${localeCode}`);
                    return [];
                } else if (!value) {
                    warn(`No value for locale: ${locale} / ${localeCode}`);
                    return [];
                } else {
                    return existingLocalesForLocale.map(code => ({ locale: code, value }));
                }
            })
            .compact()
            .value();

        const fieldTranslation: FieldTranslations<Field> = {
            identifier,
            field: translatableField,
            value: fieldValue,
            translations,
        };

        return fieldTranslation;
    }

    private getLocaleMapping(locales: string[]): Record<string, string> {
        return _(locales)
            .map(locale => {
                const locale2 = locale.toLowerCase();
                const isoCode = isoCodes.has(locale2) ? locale2 : isoLanguageCodesByName[locale2]?.iso639_1;

                if (!isoCode) {
                    log.warn(`Unknown locale name: ${locale}`);
                } else {
                    return [locale, isoCode] as [string, LanguageCodeIso839_1];
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
    .flatMap(code => code.name.split(",").map(name => [name.toLowerCase(), code] as [string, Code]))
    .fromPairs()
    .value();
