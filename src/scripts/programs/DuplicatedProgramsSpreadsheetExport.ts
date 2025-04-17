import _ from "lodash";
import XLSX from "xlsx";
import { DuplicatedEvents, ProgramEvent } from "domain/entities/ProgramEvent";
import { Id } from "domain/entities/Base";
import { Async } from "domain/entities/Async";
import logger from "utils/log";

export class DuplicatedProgramsSpreadsheetExport {
    constructor(private duplicated: DuplicatedEvents) {}

    async export(outputFilePath: string): Async<void> {
        const workbook = XLSX.utils.book_new();
        const programsById = this.getProgramsById();

        const sheets = _(this.getRowsByProgram())
            .map((groups, programId) => {
                if (groups.length === 0) return;

                const program = programsById[programId];
                if (!program) throw new Error(`Program not found: ${programId}`);

                const rows = groups.flatMap(group => [...group.events.map(getRow), {}]);
                const worksheet = XLSX.utils.json_to_sheet(rows, {});
                const sheetName = program.name.replace(/[^a-zA-Z0-9-_()\s]/g, "-").slice(0, 31);

                return { worksheet: worksheet, name: sheetName };
            })
            .compact()
            .value();

        if (sheets.length === 0) {
            logger.debug(`No sheets to export`);
            return;
        }

        sheets.forEach(sheet => {
            XLSX.utils.book_append_sheet(workbook, sheet.worksheet, sheet.name);
        });

        logger.info(`Save file ${outputFilePath}`);
        XLSX.writeFile(workbook, outputFilePath);
    }

    private getRowsByProgram() {
        return _(this.duplicated.groups)
            .groupBy(group => group.events[0]?.program.id)
            .value();
    }

    private getProgramsById() {
        return _(this.duplicated.groups)
            .flatMap(group => group.events)
            .map(ev => ev.program)
            .map(program => [program.id, program] as [Id, typeof program])
            .fromPairs()
            .value();
    }
}

function getRow(event: ProgramEvent) {
    return {
        id: event.id,
        program: event.program.id,
        programName: event.program.name,
        orgUnit: event.orgUnit.id,
        orgUnitName: event.orgUnit.name,
        ...(event.program.type === "tracker"
            ? {
                  trackedEntityId: event.trackedEntityInstanceId,
                  programStageName: event.programStage.name,
              }
            : {}),
        status: event.status,
        created: event.created,
        lastUpdated: event.lastUpdated,
        eventDate: event.date,
        dueDate: event.dueDate,
        dataValues: _(event.dataValues)
            .map(dv => `${dv.dataElement.name.trim()}=${dv.value.trim()}`)
            .join(", "),
    };
}
