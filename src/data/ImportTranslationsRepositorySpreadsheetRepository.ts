import _ from "lodash";
import { Async } from "domain/entities/Async";
import { FieldTranslation, FieldTranslations } from "domain/entities/FieldTranslations";
import {
    ImportTranslationsRepository,
    GetFieldTranslationsOptions,
} from "domain/repositories/ImportTranslationsRepository";
import { SpreadsheetXlsxDataSource } from "domain/repositories/SpreadsheetXlsxRepository";
import log from "utils/log";
import { Maybe } from "utils/ts-utils";
import { Translation } from "domain/entities/Translation";

const columnsMapping = {
    id: ["id", "uid"],
    type: ["type", "kind"],
    name: ["name"],
    code: ["code"],
};

export class ImportTranslationsRepositorySpreadsheetRepository implements ImportTranslationsRepository {
    async get(options: GetFieldTranslationsOptions): Async<FieldTranslations> {
        const { inputFile } = options;
        const spreadsheet = await new SpreadsheetXlsxDataSource().read({ inputFile, skipHidden: false });

        return _(spreadsheet.sheets)
            .flatMap((sheet): FieldTranslations => {
                return _(sheet.rows)
                    .map((row, rowIndex) => this.fromRow(row, `${sheet.name}:${rowIndex}`, options))
                    .compact()
                    .value();
            })
            .value();
    }

    private fromRow(
        row: Row,
        rowInfo: string,
        options: GetFieldTranslationsOptions
    ): Maybe<FieldTranslation> {
        const { locales } = options;
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

        const translations = _(translationColumns)
            .flatMap((translationColumn): Maybe<Translation> => {
                const [field, localeName] = translationColumn.split(":");
                const locale = localeName ? localesByName[localeName] : undefined;
                const text = row[translationColumn];

                if (!(field && text)) {
                    warn(`Translation property/text parsing failed`);
                    return undefined;
                } else if (!locale) {
                    warn(`Locale not found in DB: name=${locale}`);
                    return undefined;
                } else {
                    const property = _.upperCase(field).replace(/\s+/, "_");
                    return { property: property, locale: locale.locale, value: text };
                }
            })
            .compact()
            .value();

        return { model: model, identifier: identifier, translations };
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

type ColumnsMappingKey = keyof typeof columnsMapping;
