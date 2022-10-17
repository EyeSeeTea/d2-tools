import { Async } from "domain/entities/Async";

export interface SpreadsheetDataSource {
    read(options: ReadOptions): Async<Spreadsheet>;
}

export interface ReadOptions {
    inputFile: string;
    skipHidden: boolean;
}

export interface Spreadsheet {
    name: string;
    sheets: Sheet[];
}

export type Row<Header extends string> = Record<Header, string>;

export interface Sheet<Header extends string = string> {
    name: string;
    rows: Row<Header>[];
}
