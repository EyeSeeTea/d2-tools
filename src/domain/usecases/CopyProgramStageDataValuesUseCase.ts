import _ from "lodash";
import fs from "fs";
import { DataElement } from "domain/entities/DataElement";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { EventDataValue, ProgramEvent } from "domain/entities/ProgramEvent";
import log from "utils/log";
import { Id } from "domain/entities/Base";

export class CopyProgramStageDataValuesUseCase {
    constructor(
        private programEventsRepository: ProgramEventsRepository,
        private orgUnitRepository: OrgUnitRepository,
        private dataElementsRepository: DataElementsRepository
    ) {}

    async execute(options: CopyProgramStageDataValuesOptions): Promise<void> {
        const { programStageId, dataElementIdPairs: idPairs, post, saveReport: reportPath } = options;

        const rootOrgUnit = await this.orgUnitRepository.getRoot();
        const dataElements = await this.dataElementsRepository.getByIds(idPairs.flat());
        const dataElementPairs = this.mapDataElements(dataElements, idPairs);
        const sourceIds = idPairs.map(([sourceId, _]) => sourceId);
        const targetIds = idPairs.map(([_, targetId]) => targetId);

        checkDataElementTypes(dataElementPairs);

        const allEvents = await this.programEventsRepository.get({
            programStagesIds: [programStageId],
            orgUnitsIds: [rootOrgUnit.id],
            orgUnitMode: "DESCENDANTS",
        });

        const applicableEvents = allEvents.filter(event =>
            event.dataValues.some(dv => sourceIds.includes(dv.dataElement.id))
        );

        checkTargetDataValuesAreEmpty(applicableEvents, targetIds);

        // replace origin data element id with the destination data element id
        const eventsWithNewDataValues = applicableEvents.map(event => {
            return {
                ...event,
                dataValues: event.dataValues.flatMap(dataValue => {
                    if (sourceIds.includes(dataValue.dataElement.id)) {
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

        if (post) {
            const result = await this.programEventsRepository.save(eventsWithNewDataValues);
            if (result.type === "success") log.info(JSON.stringify(result, null, 4));
            else log.error(JSON.stringify(result, null, 4));
        } else {
            const payload = { events: eventsWithNewDataValues };
            const json = JSON.stringify(payload, null, 4);
            const now = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
            const payloadPath = `copy-program-stage-data-values-${now}.json`;

            fs.writeFileSync(payloadPath, json);
            log.info(`Written payload (${eventsWithNewDataValues.length} events): ${payloadPath}`);
        }

        if (reportPath) {
            this.saveReport(reportPath, dataElementPairs, programStageId, eventsWithNewDataValues);
        }
    }

    private mapDataElements(dataElements: DataElement[], pairs: [Id, Id][]): DataElementPair[] {
        const dataElementPairs = pairs.map(([sourceId, targetId]) => {
            const sourceElement = dataElements.find(de => de.id === sourceId);
            const targetElement = dataElements.find(de => de.id === targetId);

            if (!sourceElement || !targetElement)
                return `Data element not found for pair: [${sourceId}, ${targetId}]`;
            else return [sourceElement, targetElement];
        });

        const errors = dataElementPairs.filter(pair => typeof pair === "string");
        if (!_.isEmpty(errors)) throw new Error(errors.join("\n"));

        return dataElementPairs.filter((pair): pair is DataElementPair => typeof pair !== "string");
    }

    private saveReport(
        reportPath: string,
        dataElementPairs: DataElementPair[],
        programStageId: string,
        eventsWithNewDataValues: ProgramEvent[]
    ) {
        const deLines = dataElementPairs.map(
            ([source, target]) =>
                `Source DataElement: ${source.id} (${source.name}), Target DataElement: ${target.id} (${target.name})`
        );

        const reportLines: string[] = [
            `Program Stage ID: ${programStageId}`,
            "",
            ...deLines,
            "",
            `Number of events: ${eventsWithNewDataValues.length}`,
            "",
            ...eventsWithNewDataValues.map(event => {
                const orgUnitId = event.orgUnit.id;
                const eventId = event.id;
                const dataValueLines = dataElementPairs.flatMap(([source, target]) => {
                    const sourceValue = event.dataValues.find(dv => dv.dataElement.id === source.id)?.value;
                    const status = sourceValue ? `(${sourceValue})` : undefined;
                    return status ? [`\tCopy ${source.id} to ${target.id} ${status}`] : [];
                });

                return `Event ID: ${eventId}, OrgUnit ID: ${orgUnitId}\n${dataValueLines.join("\n")}`;
            }),
        ];

        const reportContent = reportLines.join("\n");
        fs.writeFileSync(reportPath, reportContent);
        log.info(`Written report: ${reportPath}`);
    }
}

function checkDataElementTypes(dePairs: DataElementPair[]) {
    const typeMismatchErrors = dePairs
        .filter(([source, target]) => source.valueType !== target.valueType)
        .map(([source, target]) => `Data elements [${source.id}, ${target.id}] do not have the same type.`);

    if (!_.isEmpty(typeMismatchErrors)) throw new Error(typeMismatchErrors.join("\n"));
}

function checkTargetDataValuesAreEmpty(events: ProgramEvent[], targetIds: Id[]) {
    const eventsWithNonEmptyTargetDataValues = _(events)
        .map(event => {
            const nonEmpty = event.dataValues
                .filter(dv => targetIds.includes(dv.dataElement.id))
                .filter(dv => Boolean(dv.value))
                .map(dv => `\tTarget DataElement: ${dv.dataElement.id}, Value: ${JSON.stringify(dv.value)}`)
                .join("\n");

            return _.isEmpty(nonEmpty) ? undefined : `Event ID: ${event.id}, Values: \n${nonEmpty}`;
        })
        .compact()
        .join("\n");

    const error = `Some data values of the destination data elements are not empty:\n${eventsWithNonEmptyTargetDataValues}`;
    if (eventsWithNonEmptyTargetDataValues) throw new Error(error);
}

type CopyProgramStageDataValuesOptions = {
    programStageId: string;
    dataElementIdPairs: [Id, Id][]; // [sourceDataElementId, targetDataElementId]
    post: boolean;
    saveReport?: string;
};

type DataElementPair = [DataElement, DataElement];
