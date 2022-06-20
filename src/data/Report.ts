export interface Report<Column extends string> {
    name: string;
    columns: readonly Column[];
    rows: Array<ReportRow<Column>>;
}

export type ReportRow<Column extends string> = Record<Column, string>;
