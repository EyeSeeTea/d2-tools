import _ from "lodash";
import { Id } from "@eyeseetea/d2-api";
import { DataElement } from "domain/entities/DataElement";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { EventDataValue, ProgramEvent } from "domain/entities/ProgramEvent";

export class CopyProgramStageDataValuesUseCase {
    constructor(
        private programEventsRepository: ProgramEventsRepository,
        private orgUnitRepository: OrgUnitRepository,
        private dataElementsRepository: DataElementsRepository
    ) {}

    async execute(options: CopyProgramStageDataValuesOptions): Promise<void> {
        const { programStageId, dataElementIdPairs, post } = options;

        const rootOrgUnit = await this.orgUnitRepository.getRoot();
        const dataElements = await this.dataElementsRepository.getByIds(dataElementIdPairs.flat());

        const dataElementPairs = dataElementIdPairs.map(([sourceId, targetId]) =>
            mapDataElementPair(dataElements, sourceId, targetId)
        );

        const targetBySourceId = new Map(dataElementIdPairs);

        // check each pair have the same type.
        dataElementPairs.forEach(pair => validateDataElementPair(pair));

        const events = await this.programEventsRepository.get({
            programStagesIds: [programStageId],
            orgUnitsIds: [rootOrgUnit.id],
            orgUnitMode: "DESCENDANTS",
        });

        console.log(events);

        // check if any data value of the destination data elements is not empty
        checkNonEmptyDataValues(
            events,
            dataElementIdPairs.map(([_sourceId, targetId]) => targetId)
        );

        // replace origin data element id with the destination data element id
        const sourceDataElementIds = dataElementIdPairs.map(([sourceId, _targetId]) => sourceId);
        const eventsWithNewDataValues = events.map(event => {
            return event.dataValues.flatMap(dataValue => {
                if (sourceDataElementIds.includes(dataValue.dataElement.id)) {
                    const targetId = targetBySourceId.get(dataValue.dataElement.id);
                    if (!targetId)
                        throw new Error(
                            `Target data element not found for source id: ${dataValue.dataElement}`
                        );

                    return [{ ...dataValue, dataElement: targetId }];
                } else return [];
            });
        });

        console.log(eventsWithNewDataValues);

        // post events in chunks (if post param)
        // if (post) {
        // }

        // save report: Pair of data elements (ids, names), program stage (id, name), number of events updated for each pair (some data elements will not have data value yet), total of number of events updated
        // save payload: events with the data values updated
    }
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
};

type DataElementPair = [DataElement, DataElement];
