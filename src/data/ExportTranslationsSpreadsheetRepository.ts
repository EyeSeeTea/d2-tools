import _ from "lodash";
import fs from "fs";
import XLSX from "xlsx-js-style";
import { unzipSync, zipSync } from "fflate";
import { Async } from "domain/entities/Async";
import { Locale } from "domain/entities/Locale";
import { MetadataObjectWithTranslations } from "domain/entities/MetadataObject";
import { ModelTranslationsExport } from "domain/entities/ModelTranslationsExport";
import { translationFieldToProperty } from "domain/entities/Translation";
import {
    ExportTranslationsOptions,
    ExportTranslationsRepository,
} from "domain/repositories/ExportTranslationsRepository";
import { getSingularModel } from "./dhis2-utils";
import log from "utils/log";

/* Generates a xlsx (one sheet per model) re-importable by `from-spreadsheet`.

    Columns: Type, UID, then a group per field: the base source column <field> followed
    by one <field>: <LocaleName> translation column per locale.

    When includeData is false, only the header row is written (a column template). When true,
    one row per object is written with the source values and the existing translations.

    Each field group is colored with its own hue (stronger on the header and on the base/source
    column, a light tint on the translation cells) so the wide grid stays easy to scan.
*/
export class ExportTranslationsSpreadsheetRepository implements ExportTranslationsRepository {
    async save(options: ExportTranslationsOptions): Async<void> {
        const { outputFile, sheets, includeData } = options;
        const workbook = XLSX.utils.book_new();

        sheets.forEach(sheet => {
            const { name, header, rows } = this.buildSheet(sheet, includeData);
            const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);

            worksheet["!cols"] = this.getColumnWidths(sheet, header, rows);
            worksheet["!autofilter"] = {
                ref: XLSX.utils.encode_range({
                    s: { r: 0, c: 0 },
                    e: { r: rows.length, c: header.length - 1 },
                }),
            };
            this.applyStyles(worksheet, this.getColumnStyles(sheet));

            XLSX.utils.book_append_sheet(workbook, worksheet, name);
        });

        log.info(`Save file ${outputFile}`);
        XLSX.writeFile(workbook, outputFile);

        // xlsx-js-style cannot write freeze panes, so patch the file afterwards.
        this.freezePanes(outputFile, { rows: 1, columns: 3 });
    }

    /* Pure transformation of a model export into the sheet name, header row and data rows.
       When includeData is false, no data rows are produced (a header-only template). */
    buildSheet(sheet: ModelTranslationsExport, includeData: boolean): SheetData {
        const header = this.getHeader(sheet);
        const rows = includeData ? sheet.objects.map(object => this.getRow(object, sheet)) : [];
        const name = sheet.model.replace(/[^a-zA-Z0-9-_()\s]/g, "-").slice(0, 31);
        return { name, header, rows };
    }

    /* Freeze the first `rows` rows and `columns` columns on every sheet by injecting a <pane>
       element into the worksheet XML (not supported by the writer itself). */
    private freezePanes(outputFile: string, options: { rows: number; columns: number }): void {
        const { rows, columns } = options;
        const files = unzipSync(fs.readFileSync(outputFile));
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const topLeftCell = XLSX.utils.encode_cell({ r: rows, c: columns });
        const pane =
            `<pane xSplit="${columns}" ySplit="${rows}" topLeftCell="${topLeftCell}" ` +
            `activePane="bottomRight" state="frozen"/>`;

        _.forEach(files, (content, name) => {
            if (!/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) return;
            const xml = decoder
                .decode(content)
                .replace(/<sheetView ([^>]*?)\/>/, `<sheetView $1>${pane}</sheetView>`);
            files[name] = encoder.encode(xml);
        });

        fs.writeFileSync(outputFile, Buffer.from(zipSync(files)));
    }

    /* Color the header row and tint each column according to its field group. */
    private applyStyles(worksheet: XLSX.WorkSheet, columns: ColumnStyle[]): void {
        const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1");

        for (let c = range.s.c; c <= range.e.c; c++) {
            const column = columns[c];
            if (!column) continue;

            for (let r = range.s.r; r <= range.e.r; r++) {
                const address = XLSX.utils.encode_cell({ r, c });
                const cell = worksheet[address] ?? (worksheet[address] = { t: "s", v: "" });
                cell.s = r === 0 ? headerStyle(column) : bodyStyle(column);
            }
        }
    }

    /* Column widths (in characters), clamped to a readable range. The columns of a field group
       (base + its locale columns) share a single width so empty translation columns aren't narrow. */
    private getColumnWidths(
        sheet: ModelTranslationsExport,
        header: string[],
        dataRows: string[][]
    ): XLSX.ColInfo[] {
        const minWidth = 12;
        const maxWidth = 60;
        const padding = 2;

        const contentWidth = (index: number) =>
            _(dataRows)
                .map(row => (row[index] ?? "").length)
                .push((header[index] ?? "").length)
                .max() ?? 0;

        const clamp = (width: number) => _.clamp(width + padding, minWidth, maxWidth);

        const widths = header.map((_column, index) => clamp(contentWidth(index)));

        // Unify the width within each field group: [base, locale1, locale2, ...].
        const groupSize = 1 + sheet.locales.length;
        sheet.fields.forEach((_field, fieldIndex) => {
            const start = 2 + fieldIndex * groupSize;
            const indexes = _.range(start, start + groupSize);
            const groupWidth = _(indexes).map(contentWidth).max() ?? 0;
            indexes.forEach(index => (widths[index] = clamp(groupWidth)));
        });

        return widths.map(width => ({ wch: width }));
    }

    private getHeader(sheet: ModelTranslationsExport): string[] {
        const fieldColumns = sheet.fields.flatMap(field => [
            field,
            ...sheet.locales.map(locale => this.getTranslationColumn(field, locale)),
        ]);

        return ["Type", "UID", "Name", ...fieldColumns];
    }

    /* Per-column color descriptors, aligned with getHeader. */
    private getColumnStyles(sheet: ModelTranslationsExport): ColumnStyle[] {
        const meta: ColumnStyle = {
            kind: "meta",
            headerColor: metaColor.header,
            bodyColor: metaColor.body,
        };

        const fieldColumns = sheet.fields.flatMap((_field, index): ColumnStyle[] => {
            const palette = fieldPalette[index % fieldPalette.length];
            if (!palette) return [];

            const base: ColumnStyle = {
                kind: "base",
                headerColor: palette.header,
                bodyColor: palette.base,
            };
            const locales = sheet.locales.map(
                (): ColumnStyle => ({
                    kind: "locale",
                    headerColor: palette.header,
                    bodyColor: palette.locale,
                })
            );
            return [base, ...locales];
        });

        return [meta, meta, meta, ...fieldColumns];
    }

    private getRow(object: MetadataObjectWithTranslations, sheet: ModelTranslationsExport): string[] {
        const fieldCells = sheet.fields.flatMap(field => [
            getFieldValue(object, field),
            ...sheet.locales.map(locale => this.getTranslationValue(object, field, locale)),
        ]);

        return [getSingularModel(sheet.model), object.id, object.name, ...fieldCells];
    }

    private getTranslationColumn(field: string, locale: Locale): string {
        return `${field}: ${locale.name}`;
    }

    private getTranslationValue(
        object: MetadataObjectWithTranslations,
        field: string,
        locale: Locale
    ): string {
        const property = translationFieldToProperty(field);
        const translation = object.translations.find(
            t => t.property === property && t.locale === locale.locale
        );
        return translation?.value ?? "";
    }
}

function getFieldValue(object: MetadataObjectWithTranslations, field: string): string {
    // Objects are fetched with `:owner`, so they carry all owner fields at runtime even
    // though the type only declares id/name/code/translations.
    const value = (object as unknown as Record<string, unknown>)[field];
    return typeof value === "string" ? value : "";
}

export interface SheetData {
    name: string;
    header: string[];
    rows: string[][];
}

interface ColumnStyle {
    kind: "meta" | "base" | "locale";
    headerColor: string; // fill for the header row
    bodyColor: string; // fill for the data rows
}

// Header/body fills per field group (strong header, stronger base column, light translation cells).
const fieldPalette = [
    { header: "8EAADB", base: "C9D6EC", locale: "E4EBF5" }, // blue
    { header: "A9D08E", base: "D2E4C4", locale: "EAF2E1" }, // green
    { header: "FFD966", base: "FFE9A8", locale: "FFF4D4" }, // gold
    { header: "B89BD9", base: "DAC9EC", locale: "ECE3F5" }, // purple
    { header: "F4B183", base: "F9D2B6", locale: "FCE8DB" }, // orange
    { header: "7FC5BD", base: "BCE0DB", locale: "DEF0ED" }, // teal
];

const metaColor = { header: "BFBFBF", body: "F2F2F2" };

function fill(rgb: string) {
    return { patternType: "solid", fgColor: { rgb } };
}

function border(rgb: string) {
    const side = { style: "thin", color: { rgb } };
    return { top: side, bottom: side, left: side, right: side };
}

function headerStyle(column: ColumnStyle) {
    return {
        fill: fill(column.headerColor),
        font: { bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: border("808080"),
    };
}

function bodyStyle(column: ColumnStyle) {
    return {
        fill: fill(column.bodyColor),
        font: { bold: column.kind === "base" },
        alignment: { vertical: "top", wrapText: true },
        border: border("D9D9D9"),
    };
}
