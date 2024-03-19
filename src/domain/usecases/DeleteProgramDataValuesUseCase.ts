import _ from "lodash";
import fs from "fs";
import { Async } from "domain/entities/Async";
import { getId, Id, Path } from "domain/entities/Base";
import { Timestamp } from "domain/entities/Date";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import logger from "utils/log";
import { Maybe } from "utils/ts-utils";
import { OrgUnitMode, ProgramEvent } from "domain/entities/ProgramEvent";

export class DeleteProgramDataValuesUseCase {
    constructor(private eventsRepository: ProgramEventsRepository) {}

    async execute(options: Options): Async<void> {
        const events = await this.getEvents(options);
        const eventsUpdated = this.getEventsWithDeletedDataValues(options, events);
        const eventsToSave = _.differenceWith(eventsUpdated, events, _.isEqual);
        logger.info(`Events with changes: ${eventsToSave.length}`);
        this.saveBackup(events, eventsToSave, options);
        await this.saveEvents(eventsToSave, options);
    }

    private getEventsWithDeletedDataValues(options: Options, events: ProgramEvent[]) {
        const { dataElementsIdsInclude, dataElementsIdsExclude } = options;

        const dataElementMatches = (dataElementId: Id) => {
            if (dataElementsIdsInclude) {
                return dataElementsIdsInclude.includes(dataElementId);
            } else if (dataElementsIdsExclude) {
                return !dataElementsIdsExclude.includes(dataElementId);
            } else {
                return true;
            }
        };

        return events.map((event): typeof event => {
            const dataValuesUpdated = event.dataValues.map((dataValue): typeof dataValue => {
                return dataElementMatches(dataValue.dataElementId) ? { ...dataValue, value: "" } : dataValue;
            });

            return { ...event, dataValues: dataValuesUpdated };
        });
    }

    private async saveEvents(events: ProgramEvent[], options: Options) {
        if (options.post) {
            logger.info(`POST events with changes: ${events.length}`);
            const result = await this.eventsRepository.save(events);

            if (result.type === "success") {
                logger.info(`POST successful: ${result.message}`);
            } else {
                logger.error(`POST error: ${result.message}`);
            }
        } else if (events.length > 0) {
            logger.info(`Use --post to delete values on server`);

            if (options.savePayload) {
                const json = JSON.stringify(events, null, 4);
                fs.writeFileSync(options.savePayload, json);
                logger.info(`Payload saved: ${options.savePayload}`);
            }
        }
    }

    private saveBackup(events: ProgramEvent[], eventsToPost: ProgramEvent[], options: Options) {
        if (!options.saveBackup) return;

        const eventsOriginal = _(events).keyBy(getId).at(eventsToPost.map(getId)).compact().value();
        logger.info(`Save JSON backup: ${options.saveBackup}`);
        const json = JSON.stringify(eventsOriginal, null, 4);
        fs.writeFileSync(options.saveBackup, json);
    }

    private async getEvents(options: Options) {
        logger.info(`Get events: ${JSON.stringify(options)}`);

        const events = await this.eventsRepository.get({
            orgUnitsIds: options.orgUnitsIds,
            orgUnitMode: options.orgUnitMode || "SELECTED",
            startDate: options.startDate,
            endDate: options.endDate,
        });

        logger.info(`Events: ${events.length}`);
        return events;
    }
}

interface Options {
    programIds?: Id[];
    orgUnitsIds: Id[];
    orgUnitMode?: OrgUnitMode;
    startDate: Maybe<Timestamp>;
    endDate: Maybe<Timestamp>;
    dataElementsIdsInclude: Maybe<Id[]>;
    dataElementsIdsExclude: Maybe<Id[]>;
    savePayload?: Path;
    saveBackup?: Path;
    post: boolean;
}
