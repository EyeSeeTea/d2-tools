import _ from "lodash";
import fs from "fs";
import { Id } from "@eyeseetea/d2-api";
import { DataElement } from "domain/entities/DataElement";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { EventDataValue, ProgramEvent } from "domain/entities/ProgramEvent";
import log from "utils/log";

export class CopyProgramStageDataValuesUseCase {
    constructor(
        private programEventsRepository: ProgramEventsRepository,
        private orgUnitRepository: OrgUnitRepository,
        private dataElementsRepository: DataElementsRepository
    ) {}

    async execute(options: CopyProgramStageDataValuesOptions): Promise<void> {
        const {
            programStageId,
            dataElementIdPairs,
            post,
            savePayload: payloadPath,
            saveReport: reportPath,
        } = options;

        const rootOrgUnit = await this.orgUnitRepository.getRoot();
        const dataElements = await this.dataElementsRepository.getByIds(dataElementIdPairs.flat());

        const dataElementPairs = dataElementIdPairs.map(([sourceId, targetId]) =>
            mapDataElementPair(dataElements, sourceId, targetId)
        );

        // check each pair have the same type.
        dataElementPairs.forEach(pair => validateDataElementPair(pair));
        const sourceDataElementIds = dataElementIdPairs.map(([sourceId, _targetId]) => sourceId);

        const events = await this.programEventsRepository
            .get({
                programStagesIds: [programStageId],
                orgUnitsIds: [rootOrgUnit.id],
                orgUnitMode: "DESCENDANTS",
            })
            .then(events =>
                // filter events that have at least one data value of the source data elements
                events.filter(event =>
                    event.dataValues.some(dv => sourceDataElementIds.includes(dv.dataElement.id))
                )
            );

        // check if any data value of the destination data elements is not empty
        checkNonEmptyDataValues(
            events,
            dataElementIdPairs.map(([_sourceId, targetId]) => targetId)
        );

        // replace origin data element id with the destination data element id
        const eventsWithNewDataValues = events.map(event => {
            return {
                ...event,
                dataValues: event.dataValues.flatMap(dataValue => {
                    if (sourceDataElementIds.includes(dataValue.dataElement.id)) {
                        const [_source, target] =
                            dataElementPairs.find(
                                ([source, _target]) => source.id === dataValue.dataElement.id
                            ) || [];

                        if (!target)
                            throw new Error(
                                `Target data element not found for source id: ${dataValue.dataElement.id}`
                            );

                        return [dataValue, { ...dataValue, dataElement: target }];
                    } else return [dataValue];
                }),
            };
        });

        if (payloadPath) {
            const payload = { events: eventsWithNewDataValues };
            const json = JSON.stringify(payload, null, 4);
            fs.writeFileSync(payloadPath, json);
            log.info(`Written payload (${eventsWithNewDataValues.length} events): ${payloadPath}`);
        } else if (post) {
            const result = await this.programEventsRepository.save(eventsWithNewDataValues);
            if (result.type === "success") log.info(JSON.stringify(result, null, 4));
            else log.error(JSON.stringify(result, null, 4));
        }

        if (reportPath) {
            saveReport(reportPath, dataElementPairs, programStageId, eventsWithNewDataValues);
        }
    }
}

function saveReport(
    reportPath: string,
    dataElementPairs: DataElementPair[],
    programStageId: string,
    eventsWithNewDataValues: ProgramEvent[]
) {
    const reportLines: string[] = [
        `Program Stage ID: ${programStageId}`,
        `Number of events updated: ${eventsWithNewDataValues.length}`,
        "",
    ];

    const deLines = dataElementPairs.map(([source, target]) => {
        const updatedEventsCount = eventsWithNewDataValues.filter(event =>
            event.dataValues.some(dataValue => dataValue.dataElement.id === target.id)
        ).length;

        return `Source DataElement: ${source.id} (${source.name}), Target DataElement: ${target.id} (${target.name}), Found in ${updatedEventsCount} events`;
    });

    const reportContent = reportLines.concat(deLines).join("\n");
    fs.writeFileSync(reportPath, reportContent);
    log.info(`Written report: ${reportPath}`);
}

function mapDataElementPair(dataElements: DataElement[], sourceId: Id, targetId: Id): DataElementPair {
    const sourceElement = dataElements.find(de => de.id === sourceId);
    const targetElement = dataElements.find(de => de.id === targetId);

    if (!sourceElement || !targetElement) {
        throw new Error(`Data element not found for pair: [${sourceId}, ${targetId}]`);
    }

    return [sourceElement, targetElement];
}

function validateDataElementPair([sourceDataElement, targetDataElement]: DataElementPair) {
    if (sourceDataElement.valueType !== targetDataElement.valueType) {
        throw new Error(
            `Data elements [${sourceDataElement.id}, ${targetDataElement.id}] do not have the same type.`
        );
    }
}

function checkNonEmptyDataValues(events: ProgramEvent[], targetDataElementIds: Id[]) {
    const nonEmptyDataValues = events.flatMap(event => {
        const targetDataValues = event.dataValues.filter(dataValue =>
            targetDataElementIds.some(
                targetId => dataValue.dataElement.id === targetId && Boolean(dataValue.value)
            )
        );

        return targetDataValues.length > 0 ? [{ eventId: event.id, targetDataValues }] : [];
    });

    if (!_.isEmpty(nonEmptyDataValues)) {
        throw new Error(
            `Some data values of the destination data elements are not empty: \n${formatInvalidEvents(
                nonEmptyDataValues
            )}`
        );
    }
}

function formatInvalidEvents(
    events: {
        eventId: string;
        targetDataValues: EventDataValue[];
    }[]
): string {
    return events
        .map(event => {
            const values = event.targetDataValues
                .map(
                    dataValue =>
                        `\tTarget DataElement: ${dataValue.dataElement.id}, Value: ${JSON.stringify(
                            dataValue.value
                        )}`
                )
                .join("\n");

            return `Event ID: ${event.eventId}, Values: \n${values}`;
        })
        .join("\n");
}

type CopyProgramStageDataValuesOptions = {
    programStageId: string;
    dataElementIdPairs: [Id, Id][]; // [sourceDataElementId, targetDataElementId]
    post: boolean;
    savePayload?: string;
    saveReport?: string;
};

type DataElementPair = [DataElement, DataElement];
