import _ from "lodash";
import * as CsvWriter from "csv-writer";
import { systemSettingsStore } from "capture-core/metaDataMemoryStores/systemSettings/systemSettings.store";
import { rulesEngine } from "capture-core/rules/rulesEngine";
import { Async } from "domain/entities/Async";
import { D2Api, MetadataPick, Ref } from "types/d2-api";
import {
    Constant,
    DataElementsMap,
    Enrollment,
    Id,
    OptionSetsMap,
    OrgUnit,
    ProgramRule,
    ProgramRuleEvent as ProgramEvent,
    ProgramRuleVariable,
    RuleEffect,
    TrackedEntityAttributesMap,
    TrackedEntityAttributeValuesMap,
} from "./D2ProgramRules.types";
import { checkPostEventsResponse, getData } from "data/dhis2-utils";
import log from "utils/log";
import { Event, EventsPostRequest } from "@eyeseetea/d2-api/api/events";
import { TrackedEntityInstance } from "@eyeseetea/d2-api/api/trackedEntityInstances";
import logger from "utils/log";
import { fromPairs, Maybe } from "utils/ts-utils";

export class D2ProgramRules {
    constructor(private api: D2Api) {
        systemSettingsStore.set({
            dateFormat: "YYYY-MM-DD",
        });
    }

    async run(options: { ids: Id[] }): Async<void> {
        const { metadata, effects: eventEffects } = await this.getEventEffects(options);

        const actions = _.flatMap(eventEffects, eventEffect => {
            const { program, event: event, effects } = eventEffect;

            return _(effects)
                .map((effect): Maybe<UpdateAction> => {
                    switch (effect.type) {
                        case "ASSIGN":
                            log.debug(`target=${effect.targetDataType}:${effect.id} value=${effect.value}`);

                            switch (effect.targetDataType) {
                                case "dataElement":
                                    return getUpdateAction(metadata, program, event, effect.id, effect.value);
                                case "trackedEntityAttribute":
                                    throw new Error("TODO: update tei.attributes");
                                default:
                                    return undefined;
                            }
                        default:
                            return undefined;
                    }
                })
                .compact()
                .value();
        });

        const events1 = eventEffects.map(eventEffect => eventEffect.event);
        const eventsById = _.keyBy(events1, event => event.event);

        const events2: D2EventToPost[] = _(actions)
            .groupBy(action => action.eventId)
            .toPairs()
            .map(([eventId, actions]) => {
                const event = eventsById[eventId];
                if (!event) throw new Error(`Event not found: ${eventId}`);

                return actions.reduce((accEvent, action): D2EventToPost => {
                    return event ? setDataValue(accEvent, action.dataElement.id, action.value) : accEvent;
                }, event as D2EventToPost);
            })
            .value();

        const eventsWithChanges = _.differenceWith(events2, events1, _.isEqual);
        log.debug(`Events to post: ${eventsWithChanges.length}`);
        this.postEvents(eventsWithChanges);
        this.saveReport(actions);
    }

    private async postEvents(events: D2EventToPost[]) {
        const res = await this.api.events.post({ dryRun: true }, { events }).getData();
        return checkPostEventsResponse(res);
    }

    private async saveReport(actions: UpdateAction[]) {
        type Row = Record<"program" | "orgUnit" | "eventId" | "dataElement" | "value", string>;
        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const path = "run-program-rules.csv";
        const csvWriter = createCsvWriter({
            path: path,
            header: [
                { id: "program", title: "Program" },
                { id: "orgUnit", title: "Org Unit" },
                { id: "eventId", title: "Event ID" },
                { id: "dataElement", title: "Data Elemtn" },
                { id: "value", title: "Value" },
            ],
        });

        const records = actions.map((action): Row => {
            return {
                program: action.program.name,
                orgUnit: action.orgUnit.name,
                eventId: action.eventId,
                dataElement: action.dataElement.name,
                value: JSON.stringify(action.value),
            };
        });

        await csvWriter.writeRecords(records);
        log.info(`Written: ${path}`);
    }

    async getEventEffects(options: { ids: Id[] }): Async<{ effects: EventEffect[]; metadata: Metadata }> {
        const metadataQueryWithFilter = {
            ...metadataQuery,
            programs: { ...metadataQuery.programs, filter: { id: { in: options.ids } } },
        };
        const metadata = await getData(this.api.metadata.get(metadataQueryWithFilter));

        let outputEffects: EventEffect[] = [];

        for (const program of metadata.programs) {
            log.debug(`Program: [${program.id}] ${program.name}`);
            const events = await this.getEvents(program.id);
            log.debug(`Events: ${events.length}`);
            const teis = await this.getTeis(program.id);
            log.debug(`TEIs: ${teis.length}`);

            const teisById = _.keyBy(teis, tei => tei.trackedEntityInstance);
            const enrollmentsById = _(teis)
                .flatMap(tei => tei.enrollments)
                .keyBy(enrollment => enrollment.enrollment)
                .value();

            const programRuleEvents = events.map(getProgramEvent);

            for (const d2Event of events) {
                const event = getProgramEvent(d2Event);

                logger.debug(`Process event: ${event.eventId}`);

                const selectedOrgUnit: OrgUnit = {
                    id: event.orgUnitId,
                    name: event.orgUnitName,
                    code: "",
                    groups: [],
                };

                const tei = event.trackedEntityInstanceId
                    ? teisById[event.trackedEntityInstanceId]
                    : undefined;

                const enrollment = event.enrollmentId ? enrollmentsById[event.enrollmentId] : undefined;
                debugger;

                const selectedEntity: TrackedEntityAttributeValuesMap | undefined = tei
                    ? _(tei.attributes)
                          .map(attr => [attr.attribute, attr.value] as [Id, string])
                          .fromPairs()
                          .value()
                    : undefined;

                const constants = metadata.constants;

                const getEffectsOptions: GetProgramRuleEffectsOptions = {
                    currentEvent: event,
                    otherEvents: programRuleEvents,
                    trackedEntityAttributes: getMap(
                        program.programTrackedEntityAttributes
                            .map(ptea => ptea.trackedEntityAttribute)
                            .map(tea => ({
                                id: tea.id,
                                valueType: tea.valueType,
                                optionSetId: tea.optionSet?.id,
                            }))
                    ),
                    selectedEnrollment: enrollment
                        ? {
                              enrolledAt: enrollment.enrollmentDate,
                              occurredAt: enrollment.incidentDate,
                              enrollmentId: enrollment.enrollment,
                          }
                        : undefined,
                    selectedEntity,
                    programRulesContainer: {
                        programRules: metadata.programRules
                            .filter(rule => rule.program.id === program.id)
                            .map(rule => {
                                const actions = rule.programRuleActions.map(action => ({
                                    ...action,
                                    dataElementId: action.dataElement?.id,
                                    programStageId: action.programStage?.id,
                                    programStageSectionId: action.programStageSection?.id,
                                    trackedEntityAttributeId: action.trackedEntityAttribute?.id,
                                    optionGroupId: action.optionGroup?.id,
                                    optionId: action.option?.id,
                                }));

                                return { ...rule, programId: rule.program.id, programRuleActions: actions };
                            }),
                        programRuleVariables: metadata.programRuleVariables
                            .filter(variable => variable.program.id === program.id)
                            .map(variable => ({
                                ...variable,
                                programId: variable.program?.id,
                                dataElementId: variable.dataElement?.id,
                                trackedEntityAttributeId: variable.trackedEntityAttribute?.id,
                                programStageId: variable.programStage?.id,
                            })),
                        constants,
                    },
                    dataElements: getMap(
                        metadata.dataElements.map(dataElement => ({
                            id: dataElement.id,
                            valueType: dataElement.valueType,
                            optionSetId: dataElement.optionSet?.id,
                        }))
                    ),
                    optionSets: getMap(metadata.optionSets),
                    selectedOrgUnit,
                };

                log.debug(`Get effects for: eventId=${event.eventId}`);
                const effects = getProgramRuleEffects(getEffectsOptions).filter(e => e.type === "ASSIGN");
                log.debug(`Event: ${event.eventId} - #assign_effects: ${effects.length}`);

                if (!_.isEmpty(effects)) {
                    outputEffects.push({ program, event: d2Event, effects, orgUnit: selectedOrgUnit });
                }
            }
        }

        return { effects: outputEffects, metadata };
    }

    private async getPaginated<T>(fn: (page: number) => Promise<T[]>): Async<T[]> {
        let page = 1;
        let allPagesRead = false;
        let output: T[] = [];
        while (!allPagesRead) {
            const objs = await fn(page);
            output.push(...objs);
            allPagesRead = objs.length === 0;
            page += 1;
        }
        return output;
    }

    private async getEvents(programId: Id): Async<D2Event[]> {
        return this.getPaginated(page => {
            return getData(this.api.events.get({ program: programId, page, pageSize: 1000 })).then(
                res => res.events as D2Event[]
            );
        });
    }

    private async getTeis(programId: Id): Async<TrackedEntityInstance[]> {
        return this.getPaginated(page => {
            return getData(
                this.api.trackedEntityInstances.get({
                    ouMode: "ALL",
                    program: programId,
                    page,
                    pageSize: 1000,
                    totalPages: true,
                    fields: "*",
                })
            ).then(res => res.trackedEntityInstances);
        });
    }
}

export function getProgramRuleEffects(options: GetProgramRuleEffectsOptions): RuleEffect[] {
    return rulesEngine.getProgramRuleEffects(options);
}

export function getMap<Obj extends { id: Id }>(objs: Obj[] | undefined): Record<Id, Obj> {
    return _.keyBy(objs || [], obj => obj.id);
}

export interface GetProgramRuleEffectsOptions {
    programRulesContainer: ProgramRulesContainer;
    currentEvent?: ProgramEvent;
    otherEvents?: ProgramEvent[];
    dataElements: DataElementsMap;
    selectedEntity?: TrackedEntityAttributeValuesMap | undefined;
    trackedEntityAttributes?: TrackedEntityAttributesMap | undefined;
    selectedEnrollment?: Enrollment | undefined;
    selectedOrgUnit: OrgUnit;
    optionSets: OptionSetsMap;
}

export interface ProgramRulesContainer {
    programRuleVariables: ProgramRuleVariable[];
    programRules: ProgramRule[];
    constants: Constant[];
}

const metadataQuery = {
    programs: {
        fields: {
            id: true,
            name: true,
            programTrackedEntityAttributes: {
                trackedEntityAttribute: { id: true, valueType: true, optionSet: { id: true } },
            },
            programStages: {
                programStageDataElements: {
                    dataElement: { id: true },
                },
            },
        },
    },
    dataElements: {
        fields: { id: true, name: true, valueType: true, optionSet: { id: true } },
    },
    programRules: {
        fields: {
            id: true,
            condition: true,
            displayName: true,
            program: { id: true },
            programRuleActions: { $owner: true },
        },
    },
    programRuleVariables: {
        fields: { $owner: true, displayName: true },
    },
    optionSets: {
        fields: {
            id: true,
            displayName: true,
            options: { id: true, code: true, displayName: true },
        },
    },
    constants: {
        fields: { id: true, displayName: true, value: true },
    },
} as const;

type Metadata = MetadataPick<typeof metadataQuery>;

interface D2Event extends Event {
    trackedEntityInstance: Id | undefined;
    enrollment?: Id;
    enrollmentStatus: "ACTIVE" | "COMPLETED" | "CANCELLED";
}

type Program = Metadata["programs"][number];

interface EventEffect {
    program: Program;
    event: D2Event;
    effects: RuleEffect[];
    orgUnit: OrgUnit;
}

function getProgramEvent(event: D2Event): ProgramEvent {
    const teiId = event.trackedEntityInstance;

    return {
        eventId: event.event,
        programId: event.program,
        programStageId: event.programStage,
        orgUnitId: event.orgUnit,
        orgUnitName: event.orgUnitName,
        enrollmentId: event.enrollment,
        enrollmentStatus: event.enrollmentStatus,
        status: event.status,
        occurredAt: event.eventDate,
        trackedEntityInstanceId: teiId,
        scheduledAt: event.dueDate,
        // Add data values: Record<DataElementId, Value>
        ...fromPairs(event.dataValues.map(dv => [dv.dataElement, dv.value])),
    };
}

type D2EventToPost = EventsPostRequest["events"][number];
type D2DataValueToPost = D2EventToPost["dataValues"][number];
type D2Value = string; // D2DataValueToPost["value"] | undefined;

function getUpdateAction(
    metadata: Metadata,
    program: Program,
    event: D2Event,
    dataElementId: Id,
    value: D2DataValueToPost["value"] | undefined | null
): UpdateAction | undefined {
    const programsById = _.keyBy(metadata.programs, program => program.id);
    const dataElementsById = _.keyBy(metadata.dataElements, de => de.id);

    const dataElementIdsInProgram = new Set(
        _(program.programStages)
            .flatMap(programStage => programStage.programStageDataElements)
            .map(psde => psde.dataElement)
            .map(de => de.id)
            .value()
    );

    if (!dataElementIdsInProgram.has(dataElementId)) {
        logger.debug(`Skip ASSIGN effect as dataElement ${dataElementId} does not belong to program`);
        return undefined;
    } else {
        const strValue = value === null || value === undefined ? "" : value.toString();
        return {
            eventId: event.event,
            program: programsById[event.program] || { id: event.program, name: "-" },
            orgUnit: { id: event.orgUnit, name: event.orgUnitName },
            dataElement: dataElementsById[dataElementId] || { id: dataElementId, name: "-" },
            value: strValue,
        };
    }
}

function setDataValue(
    event: D2EventToPost,
    dataElementId: Id,
    value: D2DataValueToPost["value"] | undefined
): D2EventToPost {
    const hasValue = _(event.dataValues).some(dv => dv.dataElement === dataElementId);
    const newValue = value === undefined ? "" : value;

    const dataValuesUpdated = hasValue
        ? _(event.dataValues as D2DataValueToPost[])
              .map(dv => (dv.dataElement === dataElementId ? { ...dv, value: newValue } : dv))
              .value()
        : _(event.dataValues as D2DataValueToPost[])
              .concat([{ dataElement: dataElementId, value: newValue }])
              .value();

    return { ...event, dataValues: dataValuesUpdated };
}

type NamedRef = { id: Id; name: string };

interface UpdateAction {
    eventId: Id;
    program: NamedRef;
    orgUnit: NamedRef;
    dataElement: NamedRef;
    value: D2Value;
}
