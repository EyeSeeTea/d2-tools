import fs from "fs";
import _ from "lodash";
import { promiseMap } from "data/dhis2-utils";
import { getId, Id, Ref } from "domain/entities/Base";
import { D2Api } from "types/d2-api";
import logger from "utils/log";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { ProgramsRepository } from "domain/repositories/ProgramsRepository";
import { Program } from "domain/entities/Program";
import { Maybe } from "utils/ts-utils";

type Options = {
    programId: Id;
    ternaryOptionSetId: Id;
    post: boolean;
};

export class RecodeBooleanDataValuesInEventsUseCase {
    pageSize = 1000;

    constructor(private api: D2Api, private programsRepository: ProgramsRepository) {}

    async execute(options: Options) {
        const program = await this.getProgram(options.programId);
        await this.recodeEventsForProgram({ ...options, program: program });
    }

    async getProgram(id: Id): Promise<Program> {
        const programs = await this.programsRepository.get({ ids: [id] });
        const program = programs[0];
        if (!program) throw new Error(`Program not found: ${id}`);
        return program;
    }

    async recodeEventsForProgram(options: { program: Program; post: boolean; ternaryOptionSetId: Id }) {
        const pageCount = await this.getPageCount(options);

        await promiseMap(_.range(1, pageCount + 1), async page => {
            await this.recodeEventsForPage({
                ...options,
                page: page,
                pageCount: pageCount,
                ternaryOptionSetId: options.ternaryOptionSetId,
            });
        });
    }

    private async getPageCount(options: { program: Program }) {
        const response = await this.api.tracker.events
            .get({
                ...params,
                page: 1,
                pageSize: 0,
                totalPages: true,
                program: options.program.id,
            })
            .getData();

        const pageCount = Math.ceil((response.total || 0) / this.pageSize);
        logger.info(`Total: ${response.total} -> pages: ${pageCount} (pageSize: ${this.pageSize})`);

        return pageCount;
    }

    async recodeEventsForPage(options: {
        program: Program;
        page: number;
        pageCount: number;
        post: boolean;
        ternaryOptionSetId: Id;
    }) {
        const events = await this.getEvents(options);
        const recodedEvents = this.getRecodedEvents({
            program: options.program,
            events: events,
            ternaryOptionSetId: options.ternaryOptionSetId,
        });
        logger.info(`Events to recode: ${recodedEvents.length}`);

        if (_(recodedEvents).isEmpty()) {
            return;
        } else if (!options.post) {
            logger.info(`Add --post to update events`);
        } else {
            await this.saveEvents(recodedEvents);
        }
    }

    getRecodedEvents(options: {
        program: Program;
        events: D2TrackerEvent[];
        ternaryOptionSetId: Id;
    }): D2TrackerEvent[] {
        const dataElementIdsWithTernary = this.getDataElementIdsWithTernaryOptionSet(options);

        return _(options.events)
            .map(event => this.recodeEvent(event, dataElementIdsWithTernary, options))
            .compact()
            .value();
    }

    private recodeEvent(
        event: D2TrackerEvent,
        dataElementIdsWithTernary: Set<string>,
        options: { program: Program }
    ): Maybe<D2TrackerEvent> {
        const updatedDataValues = this.recodeEventDataValues(event, dataElementIdsWithTernary);
        if (_.isEqual(event.dataValues, updatedDataValues)) return;

        // We cannot update events that have data values for data elements not assigned to the
        // program stage, so first check if that is the case.

        const dataElementIdsUsedInDataValue = _(event.dataValues)
            .map(dv => dv.dataElement)
            .uniq()
            .value();

        const dataElementIdsInProgramStage = _(options.program.programStages)
            .filter(programStage => programStage.id === event.programStage)
            .flatMap(programStage => programStage.programStageDataElements)
            .map(psde => psde.dataElement.id)
            .uniq()
            .value();

        const dataElementIdsUsedAndNotCurrentlyAssigned = _.difference(
            dataElementIdsUsedInDataValue,
            dataElementIdsInProgramStage
        );

        if (!_(dataElementIdsUsedAndNotCurrentlyAssigned).isEmpty()) {
            const tail = dataElementIdsUsedAndNotCurrentlyAssigned.join(" ");
            const head = `[skip] event.id=${event.event}`;
            const msg = `${head} [programStage.id=${event.programStage}] has unassigned dataElements: ${tail}`;
            logger.error(msg);
            return undefined;
        } else {
            return { ...event, dataValues: updatedDataValues };
        }
    }

    private recodeEventDataValues(event: D2TrackerEvent, dataElementIdsWithTernary: Set<string>) {
        return _(event.dataValues)
            .map((dataValue): typeof dataValue => {
                if (dataElementIdsWithTernary.has(dataValue.dataElement)) {
                    const newValue = ["true", "Yes"].includes(dataValue.value) ? "Yes" : "No";
                    return { ...dataValue, value: newValue };
                } else {
                    return dataValue;
                }
            })
            .value();
    }

    private getDataElementIdsWithTernaryOptionSet(options: {
        program: Program;
        events: D2TrackerEvent[];
        ternaryOptionSetId: Id;
    }) {
        const dataElements = _(options.program.programStages).flatMap(programStage => {
            return programStage.programStageDataElements.map(programStageDataElement => {
                return programStageDataElement.dataElement;
            });
        });

        const dataElementIdsWithTernaryOptions = new Set(
            dataElements
                .filter(dataElement => dataElement.optionSet?.id === options.ternaryOptionSetId)
                .map(getId)
                .value()
        );
        return dataElementIdsWithTernaryOptions;
    }

    private async saveEvents(events: D2TrackerEvent[]) {
        logger.info(`Post events: ${events.length}`);
        fs.writeFileSync("events.json", JSON.stringify(events, null, 2));

        const response = await this.api.tracker
            .post(
                {
                    async: false,
                    skipPatternValidation: true,
                    skipSideEffects: true,
                    skipRuleEngine: true,
                    importMode: "COMMIT",
                },
                { events: events }
            )
            .getData();

        logger.info(`Post result: ${JSON.stringify(response.stats)}`);
    }

    private async getEvents(options: {
        program: Ref;
        page: number;
        post: boolean;
        pageCount: number;
    }): Promise<D2TrackerEvent[]> {
        logger.info(`Get events: page ${options.page} of ${options.pageCount}`);

        const response = await this.api.tracker.events
            .get({
                ...params,
                page: options.page,
                pageSize: this.pageSize,
                program: options.program.id,
            })
            .getData();

        logger.info(`Events: ${response.instances.length}`);

        return response.instances;
    }
}

const params = {
    fields: { $all: true },
} as const;
