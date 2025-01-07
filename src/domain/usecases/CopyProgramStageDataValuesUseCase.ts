import _ from "lodash";
import fs from "fs";
import { Id } from "domain/entities/Base";
import { DataElement } from "domain/entities/DataElement";
import { DataElementsRepository } from "domain/repositories/DataElementsRepository";
import { ProgramEventsRepository } from "domain/repositories/ProgramEventsRepository";
import { OrgUnitRepository } from "domain/repositories/OrgUnitRepository";
import { ProgramEvent } from "domain/entities/ProgramEvent";
import log from "utils/log";

export class CopyProgramStageDataValuesUseCase {
    constructor(
        private programEventsRepository: ProgramEventsRepository,
        private orgUnitRepository: OrgUnitRepository,
        private dataElementsRepository: DataElementsRepository
    ) {}

    async execute(options: CopyProgramStageDataValuesOptions): Promise<ProgramEvent[]> {
        const { programStageId, dataElementIdMappings: idMappings, post, saveReport: reportPath } = options;

        const { rootOrgUnit, deMappings, sourceIds, targetIds } = await this.fetchElements(idMappings);

        checkDataElementTypes(deMappings);

        const allEvents = await this.fetchEvents(programStageId, rootOrgUnit.id);
        const applicableEvents = this.filterApplicableEvents(allEvents, sourceIds);

        checkTargetDataValuesAreEmpty(applicableEvents, targetIds);

        const eventsWithNewDataValues = this.copyEventDataValues({ applicableEvents, sourceIds, deMappings });

        await this.saveOrExport(eventsWithNewDataValues, post);

        if (reportPath) {
            this.saveReport({ path: reportPath, deMappings, programStageId, eventsWithNewDataValues });
        }

        return eventsWithNewDataValues;
    }

    private async fetchElements(idMappings: { source: Id; target: Id }[]) {
        const rootOrgUnit = await this.orgUnitRepository.getRoot();
        const dataElements = await this.dataElementsRepository.getByIds(
            idMappings.flatMap(({ source, target }) => [source, target])
        );
        const deMappings = this.mapDataElements(dataElements, idMappings);
        const sourceIds = idMappings.map(({ source }) => source);
        const targetIds = idMappings.map(({ target }) => target);

        return { rootOrgUnit, deMappings, sourceIds, targetIds };
    }

    private fetchEvents(programStageId: string, rootOrgUnitId: string): Promise<ProgramEvent[]> {
        return this.programEventsRepository.get({
            programStagesIds: [programStageId],
            orgUnitsIds: [rootOrgUnitId],
            orgUnitMode: "DESCENDANTS",
        });
    }

    private filterApplicableEvents(allEvents: ProgramEvent[], sourceIds: string[]): ProgramEvent[] {
        return allEvents.filter(event => event.dataValues.some(dv => sourceIds.includes(dv.dataElement.id)));
    }

    private async saveOrExport(eventsWithNewDataValues: ProgramEvent[], post: boolean) {
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
    }

    private copyEventDataValues(args: {
        applicableEvents: ProgramEvent[];
        sourceIds: string[];
        deMappings: DataElementMapping[];
    }): ProgramEvent[] {
        const { applicableEvents, sourceIds, deMappings } = args;

        return applicableEvents.map(event => ({
            ...event,
            dataValues: event.dataValues.flatMap(dv => {
                const targetDe = deMappings.find(({ source }) => source.id === dv.dataElement.id)?.target;

                if (!sourceIds.includes(dv.dataElement.id)) return [dv];
                else if (targetDe) return [dv, { ...dv, dataElement: _.omit(targetDe, "valueType") }];
                else throw new Error(`Target data element not found for source id: ${dv.dataElement.id}`);
            }),
        }));
    }

    private mapDataElements(
        dataElements: DataElement[],
        idMappings: { source: Id; target: Id }[]
    ): DataElementMapping[] {
        const deMappings = idMappings.map(({ source, target }) => {
            const sourceElement = dataElements.find(de => de.id === source);
            const targetElement = dataElements.find(de => de.id === target);

            if (!sourceElement || !targetElement)
                return `Data element not found for pair: ${source}-${target}`;
            else return { source: sourceElement, target: targetElement };
        });

        const errors = deMappings.filter(mapping => typeof mapping === "string");
        if (!_.isEmpty(errors)) throw new Error(errors.join("\n"));

        return deMappings.filter((mapping): mapping is DataElementMapping => typeof mapping !== "string");
    }

    private saveReport(args: {
        path: string;
        deMappings: DataElementMapping[];
        programStageId: string;
        eventsWithNewDataValues: ProgramEvent[];
    }) {
        const { path, deMappings, programStageId, eventsWithNewDataValues } = args;

        const dataElementLines = deMappings.map(
            ({ source, target }) =>
                `Source DataElement: ${source.id} (${source.name}), Target DataElement: ${target.id} (${target.name})`
        );

        const eventLines = eventsWithNewDataValues.map(event => {
            const dataValueLines = deMappings.flatMap(({ source, target }) => {
                const sourceValue = event.dataValues.find(dv => dv.dataElement.id === source.id)?.value;
                const status = sourceValue ? `(${sourceValue})` : undefined;
                return status ? [`\tCopy ${source.id} to ${target.id} ${status}`] : [];
            });

            return `Event ID: ${event.id}, OrgUnit ID: ${event.orgUnit.id}\n${dataValueLines.join("\n")}`;
        });

        const content = [
            "Program Stage ID: " + programStageId,
            dataElementLines.join("\n"),
            "Number of events: " + eventsWithNewDataValues.length,
            eventLines.join("\n"),
        ].join("\n\n");

        fs.writeFileSync(path, content);
        log.info(`Written report: ${path}`);
    }
}

function checkDataElementTypes(deMappings: DataElementMapping[]) {
    const typeMismatchErrors = deMappings
        .filter(({ source, target }) => source.valueType !== target.valueType)
        .map(({ source, target }) => `Data elements [${source.id}, ${target.id}] do not have the same type.`);

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

export type CopyProgramStageDataValuesOptions = {
    programStageId: string;
    dataElementIdMappings: { source: Id; target: Id }[];
    post: boolean;
    saveReport?: string;
};

type DataElementMapping = { source: DataElement; target: DataElement };
