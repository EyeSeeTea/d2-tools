import _ from "lodash";
import * as CsvWriter from "csv-writer";
import { systemSettingsStore } from "capture-core/metaDataMemoryStores/systemSettings/systemSettings.store";
import { rulesEngine } from "capture-core/rules/rulesEngine";
import { Async } from "domain/entities/Async";
import { D2Api, MetadataPick } from "types/d2-api";
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
import { Attribute, TrackedEntityInstance } from "@eyeseetea/d2-api/api/trackedEntityInstances";
import logger from "utils/log";
import { fromPairs, Maybe } from "utils/ts-utils";
import { RunRulesOptions } from "domain/repositories/ProgramsRepository";

export class D2ProgramRules {
    constructor(private api: D2Api) {
        systemSettingsStore.set({
            dateFormat: "YYYY-MM-DD",
        });
    }

    async run(options: RunRulesOptions): Async<void> {
        const { post, reportPath } = options;

        const { metadata, effects: eventEffects } = await this.getEventEffects(options);
        const actions = this.getActions(eventEffects, metadata);
        const eventsCurrent = eventEffects.map(eventEffect => eventEffect.event);
        const eventsById = _.keyBy(eventsCurrent, event => event.event);
        const eventsUpdated = this.getUpdatedEvents(actions, eventsById);

        const eventsWithChanges = _.differenceWith(eventsUpdated, eventsCurrent, _.isEqual);
        log.debug(`Events to post: ${eventsWithChanges.length}`);
        if (post) this.postEvents(eventsWithChanges);

        const teisCurrent = _.compact(eventEffects.map(eventEffect => eventEffect.tei));
        const teisUpdated: TrackedEntityInstance[] = this.getUpdatedTeis(teisCurrent, actions);
        const teisWithChanges = _.differenceWith(teisUpdated, teisCurrent, _.isEqual);
        log.debug(`TEIs to post: ${teisWithChanges.length}`);
        if (post) this.postTeis(teisWithChanges);

        if (reportPath) this.saveReport(reportPath, actions);
    }

    private getUpdatedTeis(teisCurrent: TrackedEntityInstance[], actions: UpdateAction[]) {
        const teisById = _.keyBy(teisCurrent, tei => tei.trackedEntityInstance);

        const teisUpdated: TrackedEntityInstance[] = _(actions)
            .uniqWith(_.isEqual)
            .map(action => (action.type === "teiAttribute" ? action : null))
            .compact()
            .groupBy(action => action.teiId)
            .toPairs()
            .map(([teiId, actions]) => {
                const tei = teisById[teiId];
                if (!tei) throw new Error(`TEI found: ${teiId}`);

                return actions.reduce((accTei, action): TrackedEntityInstance => {
                    return setTeiAttributeValue(accTei, action.attribute.id, action.value);
                }, tei);
            })
            .value();
        return teisUpdated;
    }

    private getUpdatedEvents(actions: UpdateAction[], eventsById: _.Dictionary<D2Event>): D2EventToPost[] {
        return _(actions)
            .uniqWith(_.isEqual)
            .map(action => (action.type === "event" ? action : null))
            .compact()
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
    }

    private getActions(eventEffects: EventEffect[], metadata: Metadata): UpdateAction[] {
        return _.flatMap(eventEffects, eventEffect => {
            return _(eventEffect.effects)
                .map(ruleEffect => this.getUpdateAction(ruleEffect, eventEffect, metadata))
                .compact()
                .value();
        });
    }

    private getUpdateAction(
        effect: RuleEffect,
        eventEffect: EventEffect,
        metadata: Metadata
    ): Maybe<UpdateAction> {
        const { program, event, tei } = eventEffect;
        switch (effect.type) {
            case "ASSIGN":
                log.debug(
                    `Effect type=${effect.type} target=${effect.targetDataType}:${effect.id} value=${effect.value}`
                );

                switch (effect.targetDataType) {
                    case "dataElement":
                        return getUpdateActionEvent(metadata, program, event, effect.id, effect.value);
                    case "trackedEntityAttribute":
                        if (!tei) throw new Error("No TEI");

                        return getUpdateActionTeiAttribute(program, tei, effect.id, effect.value);
                    default:
                        return undefined;
                }
            default:
                return undefined;
        }
    }
    private async postEvents(events: D2EventToPost[]) {
        if (_.isEmpty(events)) return;
        const res = await this.api.events.post(postOptions, { events }).getData();
        log.debug(`POST events: ${res.response.status}`);
        return checkPostEventsResponse(res);
    }

    private async postTeis(teis: TrackedEntityInstance[]) {
        if (_.isEmpty(teis)) return;
        if (postOptions.dryRun) return; // dryRun does not work on TEI, skip POST altogether
        const res = await this.api.trackedEntityInstances
            .post(postOptions, { trackedEntityInstances: teis })
            .getData();
        log.debug(`POST teis: ${res.response.status}`);
    }

    private async saveReport(reportPath: string, actions: UpdateAction[]) {
        type Attr =
            | "type"
            | "program"
            | "orgUnit"
            | "eventId"
            | "teiId"
            | "dataElementOrAttribute"
            | "value"
            | "valuePrev";
        type Row = Record<Attr, string>;

        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const header: Array<{ id: Attr; title: string }> = [
            { id: "program", title: "Program" },
            { id: "type", title: "Type" },
            { id: "orgUnit", title: "Org Unit" },
            { id: "eventId", title: "Event ID" },
            { id: "teiId", title: "TEI ID" },
            { id: "dataElementOrAttribute", title: "DE / TeiAttribute" },
            { id: "valuePrev", title: "Previous Value" },
            { id: "value", title: "Value" },
        ];
        const csvWriter = createCsvWriter({ path: reportPath, header });

        const records = actions.map((action): Row => {
            return {
                type: action.type,
                program: action.program.name,
                orgUnit: action.orgUnit.name,
                eventId: action.type === "event" ? action.eventId : "-",
                teiId: action.type === "teiAttribute" ? action.teiId : "-",
                dataElementOrAttribute:
                    action.type === "event" ? action.dataElement.name : action.attribute.name,
                value: action.value,
                valuePrev: action.valuePrev,
            };
        });

        await csvWriter.writeRecords(records);

        log.info(`Written: ${reportPath}`);
    }

    async getEventEffects(options: RunRulesOptions): Async<{ effects: EventEffect[]; metadata: Metadata }> {
        const metadata = await getData(
            this.api.metadata.get({
                ...metadataQuery,
                programs: { ...metadataQuery.programs, filter: { id: { in: options.ids } } },
            })
        );

        const outputEffects: EventEffect[] = [];

        for (const program of metadata.programs) {
            for (const programStage of program.programStages) {
                const eventEffect = await this.getEventEffect({
                    program,
                    programStage,
                    metadata,
                    startDate: options.startDate,
                });
                if (eventEffect) outputEffects.push(eventEffect);
            }
        }

        return { effects: outputEffects, metadata };
    }

    private async getEventEffect(options: {
        program: Program;
        programStage: ProgramStage;
        metadata: Metadata;
        startDate?: string;
    }): Promise<Maybe<EventEffect>> {
        const { program, programStage, metadata } = options;

        log.debug(`Get data for ${program.id}: ${program.name} / ${programStage.name}`);

        log.debug(`Get events`);
        const events = await this.getEvents({
            programId: program.id,
            programStageId: programStage.id,
            startDate: options.startDate,
        });
        log.debug(`Events: ${events.length}`);

        log.debug(`Get trackedEntities`);
        const teis = await this.getTeis(program.id);
        log.debug(`Tracked Entities: ${teis.length}`);

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

            const tei = event.trackedEntityInstanceId ? teisById[event.trackedEntityInstanceId] : undefined;

            const enrollment = event.enrollmentId ? enrollmentsById[event.enrollmentId] : undefined;

            const selectedEntity: TrackedEntityAttributeValuesMap | undefined = tei
                ? _(tei.attributes)
                      .map(attr => [attr.attribute, attr.value] as [Id, string])
                      .fromPairs()
                      .value()
                : undefined;

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
                    constants: metadata.constants,
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

            log.debug(`Get effects: eventId=${event.eventId} (tei: ${tei?.trackedEntityInstance || "-"})`);
            const effects = getProgramRuleEffects(getEffectsOptions).filter(e => e.type === "ASSIGN");
            log.debug(`Event: ${event.eventId} - assign_effects: ${effects.length}`);

            if (!_.isEmpty(effects)) {
                const eventEffect: EventEffect = {
                    program,
                    event: d2Event,
                    effects,
                    orgUnit: selectedOrgUnit,
                    tei,
                };

                return eventEffect;
            }
        }
    }

    private async getPaginated<T>(fn: (page: number) => Promise<T[]>): Async<T[]> {
        let page = 1;
        let allPagesRead = false;
        const objects: T[] = [];

        while (!allPagesRead) {
            const objs = await fn(page);
            objects.push(...objs);
            allPagesRead = objs.length === 0;
            page += 1;
        }

        return objects;
    }

    private async getEvents(options: {
        programId: Id;
        programStageId?: Id;
        startDate?: string;
    }): Async<D2Event[]> {
        return this.getPaginated(page => {
            return getData(
                this.api.events.get({
                    program: options.programId,
                    page,
                    startDate: options.startDate,
                    programStage: options.programStageId,
                    pageSize: 1_000,
                })
            ).then(res => res.events as D2Event[]);
        });
    }

    private async getTeis(programId: Id): Async<TrackedEntityInstance[]> {
        return this.getPaginated(page => {
            return getData(
                this.api.trackedEntityInstances.get({
                    ouMode: "ALL",
                    program: programId,
                    page,
                    pageSize: 1_000,
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
                trackedEntityAttribute: {
                    id: true,
                    name: true,
                    valueType: true,
                    optionSet: { id: true },
                },
            },
            programStages: {
                id: true,
                name: true,
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
type ProgramStage = Program["programStages"][number];

interface EventEffect {
    program: Program;
    event: D2Event;
    effects: RuleEffect[];
    orgUnit: OrgUnit;
    tei?: TrackedEntityInstance;
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

function getUpdateActionEvent(
    metadata: Metadata,
    program: Program,
    event: D2Event,
    dataElementId: Id,
    value: D2DataValueToPost["value"] | undefined | null
): UpdateActionEvent | undefined {
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
            type: "event",
            eventId: event.event,
            program,
            orgUnit: { id: event.orgUnit, name: event.orgUnitName },
            dataElement: dataElementsById[dataElementId] || { id: dataElementId, name: "-" },
            value: strValue,
            valuePrev: event.dataValues.find(dv => dv.dataElement === dataElementId)?.value ?? "-",
        };
    }
}

function getUpdateActionTeiAttribute(
    program: Program,
    tei: TrackedEntityInstance,
    attributeId: Id,
    value: D2DataValueToPost["value"] | undefined | null
): UpdateActionTeiAttribute | undefined {
    const attributes = _(program.programTrackedEntityAttributes)
        .flatMap(ptea => ptea.trackedEntityAttribute)
        .value();

    const attributesById = _.keyBy(attributes, de => de.id);
    const attributeIdsInProgram = new Set(attributes.map(de => de.id));

    if (!attributeIdsInProgram.has(attributeId)) {
        logger.debug(`Skip ASSIGN effect as attribute ${attributeId} does not belong to program`);
        return undefined;
    } else {
        const strValue = value === null || value === undefined ? "" : value.toString();
        return {
            type: "teiAttribute",
            teiId: tei.trackedEntityInstance,
            program,
            orgUnit: { id: tei.orgUnit, name: tei.orgUnit },
            attribute: attributesById[attributeId] || { id: attributeId, name: "-" },
            value: strValue,
            valuePrev: tei.attributes.find(dv => dv.attribute === attributeId)?.value ?? "-",
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

function setTeiAttributeValue(
    tei: TrackedEntityInstance,
    attributeId: Id,
    value: D2DataValueToPost["value"] | undefined
): TrackedEntityInstance {
    const hasValue = _(tei.attributes).some(attr => attr.attribute === attributeId);
    const newValue = value === undefined ? "" : value.toString();

    const attributesUpdated: Attribute[] = hasValue
        ? _(tei.attributes)
              .map(dv => (dv.attribute === attributeId ? { ...dv, value: newValue } : dv))
              .value()
        : _(tei.attributes)
              .concat([{ attribute: attributeId, value: newValue }])
              .value();

    return { ...tei, attributes: attributesUpdated };
}

type NamedRef = { id: Id; name: string };

type UpdateAction = UpdateActionEvent | UpdateActionTeiAttribute;

interface UpdateActionEvent {
    type: "event";
    eventId: Id;
    program: NamedRef;
    orgUnit: NamedRef;
    dataElement: NamedRef;
    value: D2Value;
    valuePrev: string;
}

interface UpdateActionTeiAttribute {
    type: "teiAttribute";
    teiId: Id;
    program: NamedRef;
    orgUnit: NamedRef;
    attribute: NamedRef;
    value: D2Value;
    valuePrev: string;
}

const postOptions = { dryRun: false };
