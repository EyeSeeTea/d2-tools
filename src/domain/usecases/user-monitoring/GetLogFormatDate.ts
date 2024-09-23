export class GetLogFormatDate {
    private logFormatDate(date: Date): string {
        const isoString = date.toISOString();

        return isoString.replace("Z", "");
    }

    constructor() {}

    execute(date: Date): string {
        return this.logFormatDate(date);
    }
}
