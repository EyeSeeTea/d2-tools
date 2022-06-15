import _ from "lodash";
import isoLanguageCodes from "iso-language-codes";

import { Async } from "domain/entities/Async";
import { FieldTranslations, LocaleIso839_1 } from "domain/entities/FieldTranslations";
import {
    FieldTranslationsRepository,
    GetFieldTranslationsOptions,
} from "domain/repositories/FieldTranslationsRepository";
import { SpreadsheetXlsxDataSource } from "domain/repositories/SpreadsheetXlsxRepository";
import log from "utils/log";

export class FieldTranslationsSpreadsheetRepository implements FieldTranslationsRepository {
    async get<Field extends string>(
        options: GetFieldTranslationsOptions<Field>
    ): Async<FieldTranslations<Field>[]> {
        const { translatableField, inputFile, skipHeaders, countryMapping } = options;

        const spreadsheet = await new SpreadsheetXlsxDataSource().read({
            inputFile,
            skipHidden: false,
        });

        const fieldTranslations = _(spreadsheet.sheets)
            .flatMap(sheet => {
                // Get headers from first row and create the locale mapping.
                const referenceRow = _.first(sheet.rows);
                const headers = _.keys(referenceRow);
                const locales = _.difference(headers, [identifierField, translatableField, ...skipHeaders]);
                if (!referenceRow) return [];

                const localeMapping: Record<string, LocaleIso839_1> = _(locales)
                    .map(locale => {
                        const isoCode = isoLanguageCodesByName[locale];

                        if (!isoCode) {
                            log.warn(`Unknown locale name: ${locale}`);
                        } else {
                            return [locale, isoCode.iso639_1] as [string, LocaleIso839_1];
                        }
                    })
                    .compact()
                    .fromPairs()
                    .value();

                return sheet.rows.map((row, idx) => {
                    const headers = _.keys(row);
                    const locales = _.difference(headers, [
                        identifierField,
                        translatableField,
                        ...skipHeaders,
                    ]);
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
            })
            .value();

        return _.compact(fieldTranslations);
    }
}

const identifierField = "name";

// Locale names can be comma-separated: split in different entries
const isoLanguageCodesByName = _(isoLanguageCodes)
    .flatMap(code => code.name.split(",").map(name => [name, code]))
    .fromPairs()
    .value();
