import _ from "lodash";
import path from "path";
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
    RuleEffectAssign,
    TrackedEntityAttributesMap,
    TrackedEntityAttributeValuesMap,
} from "./D2ProgramRules.types";
import { checkPostEventsResponse, getData, getInChunks } from "data/dhis2-utils";
import log from "utils/log";
import { Event, EventsPostRequest, EventsPostResponse } from "@eyeseetea/d2-api/api/events";
import {
    Attribute,
    TeiPostResponse,
    TrackedEntityInstance,
} from "@eyeseetea/d2-api/api/trackedEntityInstances";
import logger from "utils/log";
import { fromPairs, Maybe } from "utils/ts-utils";
import { RunRulesOptions } from "domain/repositories/ProgramsRepository";
import { HttpResponse } from "@eyeseetea/d2-api/api/common";

export class D2ProgramRules {
    constructor(private api: D2Api) {
        systemSettingsStore.set({
            dateFormat: "YYYY-MM-DD",
        });
    }

    async run(options: RunRulesOptions): Async<void> {
        const { post, reportPath } = options;

        const metadata = await this.getMetadata(options);
        let page = 1;

        await this.getEventEffects(metadata, options, async eventEffects => {
            const actions = this.getActions(eventEffects, metadata);
            const eventsCurrent = eventEffects.map(eventEffect => eventEffect.event);
            const eventsById = _.keyBy(eventsCurrent, event => event.event);
            const eventsUpdated = this.getUpdatedEvents(actions, eventsById);

            const eventsWithChanges = diff(eventsUpdated, eventsCurrent);
            if (!_(eventsWithChanges).isEmpty())
                log.info(`Events with changes to post: ${eventsWithChanges.length}`);
            if (post) await this.postEvents(eventsWithChanges);

            const teisCurrent = _.compact(eventEffects.map(eventEffect => eventEffect.tei));
            const teisUpdated: TrackedEntityInstance[] = this.getUpdatedTeis(teisCurrent, actions);
            const teisWithChanges = diff(teisUpdated, teisCurrent);
            if (!_(teisWithChanges).isEmpty())
                log.info(`TEIs with changes to post: ${teisWithChanges.length}`);
            if (post) await this.postTeis(teisWithChanges);

            if (reportPath) await this.saveReport(reportPath, page, actions);
            page++;
        });
    }

    private async getMetadata(options: RunRulesOptions): Promise<Metadata> {
        log.debug("Get metadata for programs");
        const metadata0 = await getData(
            this.api.metadata.get({
                ...metadataQuery,
                programs: { ...metadataQuery.programs, filter: { id: { in: options.programIds } } },
            })
        );

        return {
            ...metadata0,
            dataElementsById: _.keyBy(metadata0.dataElements),
        };
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
                    return setTeiAttributeValue(accTei, action.teiAttribute.id, action.value);
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
                log.trace(`Effect ${effect.type} ${effect.targetDataType}:${effect.id} -> ${effect.value}`);

                switch (effect.targetDataType) {
                    case "dataElement":
                        return getUpdateActionEvent(metadata, program, event, effect.id, effect.value);
                    case "trackedEntityAttribute":
                        if (!tei) {
                            log.error("No TEI to assign effect to");
                            return undefined;
                        } else {
                            return getUpdateActionTeiAttribute(program, event, tei, effect);
                        }
                    default:
                        return undefined;
                }
            default:
                return undefined;
        }
    }

    private async postEvents(events: D2EventToPost[]) {
        if (_.isEmpty(events)) return;

        const res = await this.api.events
            .post(postOptions, { events })
            .getData()
            .catch(err => err.response.data as HttpResponse<EventsPostResponse>);

        log.info(`POST events: ${res.response.status}`);
        return checkPostEventsResponse(res);
    }

    private async postTeis(teis: TrackedEntityInstance[]) {
        if (_.isEmpty(teis)) return;
        if (postOptions.dryRun) return; // dryRun does not work on TEI, skip POST altogether

        const res = await this.api.trackedEntityInstances
            .post(postOptions, { trackedEntityInstances: teis })
            .getData()
            .catch(err => err.response.data as HttpResponse<TeiPostResponse>);

        log.info(`POST TEIs: ${res.response.status}`);

        if (res.response.status !== "SUCCESS")
            log.error(JSON.stringify(res.response.importSummaries, null, 4));
    }

    private async saveReport(reportPath0: string, index: number, actions: UpdateAction[]) {
        type Attr =
            | "actionType"
            | "program"
            | "orgUnit"
            | "eventId"
            | "dataElement"
            | "teiId"
            | "teiAttribute"
            | "value"
            | "valuePrev";
        type Row = Record<Attr, string>;

        const reportPath = path.join(
            path.dirname(reportPath0),
            path.basename(reportPath0).replace(/\.(\w+)$/, `-${index}.$1`)
        );

        const createCsvWriter = CsvWriter.createObjectCsvWriter;

        const header: Array<{ id: Attr; title: string }> = [
            { id: "program", title: "Program" },
            { id: "orgUnit", title: "Org Unit" },
            { id: "eventId", title: "Event ID" },
            { id: "teiId", title: "TEI ID" },
            { id: "actionType", title: "Action Type" },
            { id: "dataElement", title: "Data element" },
            { id: "teiAttribute", title: "TEI Attribute" },
            { id: "valuePrev", title: "Current Value" },
            { id: "value", title: "New Value" },
        ];
        const csvWriter = createCsvWriter({ path: reportPath, header });

        const formatObj = (obj: NamedRef) => `${obj.name.trim()} [${obj.id}]`;

        const records = actions.map((action): Row | undefined => {
            const valueChanged = action.value != action.valuePrev;
            if (!valueChanged) return;

            return {
                program: formatObj(action.program),
                orgUnit: formatObj(action.orgUnit),
                eventId: action.eventId || "-",
                teiId: action.teiId || "-",
                actionType: action.type,
                dataElement: action.type === "event" ? formatObj(action.dataElement) : "-",
                teiAttribute: action.type === "teiAttribute" ? formatObj(action.teiAttribute) : "-",
                value: action.value,
                valuePrev: action.valuePrev,
            };
        });

        await csvWriter.writeRecords(_.compact(records));

        log.info(`Written: ${reportPath}`);
    }

    async getEventEffects(
        metadata: Metadata,
        options: RunRulesOptions,
        onEffects: (eventEffects: EventEffect[]) => void
    ): Async<void> {
        for (const program of metadata.programs) {
            for (const programStage of program.programStages) {
                if (options.programStagesIds && !options.programStagesIds.includes(programStage.id)) continue;

                await this.getEventEffectsFromProgramStage(
                    {
                        program,
                        programStage,
                        metadata,
                    },
                    options,
                    onEffects
                );
            }
        }
    }

    private async getEventEffectsFromProgramStage(
        options: {
            program: Program;
            programStage: ProgramStage;
            metadata: Metadata;
        },
        runOptions: RunRulesOptions,
        onEffects: (eventEffects: EventEffect[]) => void
    ): Promise<void> {
        const { program, programStage, metadata } = options;
        const { startDate, endDate, orgUnitsIds, programRulesIds } = runOptions;

        log.info(`Get data for ${program.id}: ${program.name} / ${programStage.name}`);

        const orgUnits = orgUnitsIds ? orgUnitsIds : [undefined];

        for (const orgUnit of orgUnits) {
            await this.getPaginated(async page => {
                log.info(
                    `Get events: program=${program.id}, programStage=${programStage.id}, orgUnit=${orgUnit}, startDate=${startDate} endDate=${endDate}, page=${page}`
                );

                const events = await getData(
                    this.api.events.get({
                        program: program.id,
                        programStage: programStage.id,
                        orgUnit,
                        startDate,
                        endDate,
                        page,
                        pageSize: 1_000,
                    })
                ).then(res => res.events as D2Event[]);

                log.info(`Events: ${events.length}`);

                const teiIds = _(events)
                    .map(event => event.trackedEntityInstance)
                    .compact()
                    .uniq()
                    .value();

                log.debug(`Get tracked entities for events: ${teiIds.length}`);
                const teis = await this.getTeis(teiIds);
                log.info(`Tracked entities: ${teis.length}`);

                const teisById = _.keyBy(teis, tei => tei.trackedEntityInstance);
                const enrollmentsById = _(teis)
                    .flatMap(tei => tei.enrollments)
                    .keyBy(enrollment => enrollment.enrollment)
                    .value();

                const programRuleEvents = events.map(event => getProgramEvent(event, metadata));
                const eventEffects: EventEffect[] = [];

                for (const d2Event of events) {
                    const event = getProgramEvent(d2Event, metadata);

                    logger.trace(`Process event: ${event.eventId}`);

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
                                .filter(rule => !programRulesIds || programRulesIds.includes(rule.id))
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

                                    return {
                                        ...rule,
                                        programId: rule.program.id,
                                        programRuleActions: actions,
                                    };
                                }),
                            programRuleVariables: metadata.programRuleVariables
                                .filter(variable => variable.program.id === program.id)
                                .map(
                                    (variable): ProgramRuleVariable => ({
                                        ...variable,
                                        programId: variable.program?.id,
                                        dataElementId: variable.dataElement?.id,
                                        trackedEntityAttributeId: variable.trackedEntityAttribute?.id,
                                        programStageId: variable.programStage?.id,
                                        // 2.38 has valueType. For older versions, get from DE/TEA.
                                        valueType:
                                            variable.valueType ||
                                            variable.dataElement?.valueType ||
                                            variable.trackedEntityAttribute?.valueType ||
                                            "TEXT",
                                    })
                                ),
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

                    log.trace(
                        `Get effects: eventId=${event.eventId} (tei: ${tei?.trackedEntityInstance || "-"})`
                    );
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

                        eventEffects.push(eventEffect);
                    }
                }

                await onEffects(eventEffects);
                return events;
            });
        }

        return;
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

    private async getTeis(ids: Id[]): Async<TrackedEntityInstance[]> {
        return getInChunks(ids, groupOfIds => {
            return getData(
                this.api.trackedEntityInstances.get({
                    ouMode: "ALL",
                    trackedEntityInstance: groupOfIds.join(";"),
                    fields: "*",
                    totalPages: true,
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
        fields: {
            $owner: true,
            displayName: true,
            dataElement: { id: true, valueType: true },
            trackedEntityAttribute: { id: true, valueType: true },
        },
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

type MetadataQuery = typeof metadataQuery;
type BaseMetadata = MetadataPick<MetadataQuery>;
type D2ProgramRuleVariableBase = BaseMetadata["programRuleVariables"][number];
type D2DataElement = BaseMetadata["dataElements"][number];

interface D2ProgramRuleVariableWithValueType extends D2ProgramRuleVariableBase {
    // Present from2.38
    valueType?: string;
}

interface Metadata extends MetadataPick<MetadataQuery> {
    programRuleVariables: D2ProgramRuleVariableWithValueType[];
    dataElementsById: Record<Id, D2DataElement>;
}

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

function getProgramEvent(event: D2Event, metadata: Metadata): ProgramEvent {
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
        ...fromPairs(
            event.dataValues.map(dv => {
                const valueType = metadata.dataElementsById[dv.dataElement]?.valueType;
                const isBoolean = valueType && ["BOOLEAN", "TRUE_ONLY"].includes(valueType);
                const value = isBoolean ? dv.value.toString() === "true" : false;
                return [dv.dataElement, value];
            })
        ),
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
            teiId: event.trackedEntityInstance,
            program,
            orgUnit: { id: event.orgUnit, name: event.orgUnitName },
            dataElement: dataElementsById[dataElementId] || { id: dataElementId, name: "-" },
            value: strValue,
            valuePrev: event.dataValues.find(dv => dv.dataElement === dataElementId)?.value ?? "",
        };
    }
}

function getUpdateActionTeiAttribute(
    program: Program,
    event: D2Event,
    tei: TrackedEntityInstance,
    ruleEffectAssign: RuleEffectAssign
): UpdateActionTeiAttribute | undefined {
    const { id: attributeId, value } = ruleEffectAssign;
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
            eventId: event.event,
            teiId: tei.trackedEntityInstance,
            program,
            orgUnit: { id: tei.orgUnit, name: tei.orgUnit },
            teiAttribute: attributesById[attributeId] || { id: attributeId, name: "-" },
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
    if (!hasValue && !newValue) return event;

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
    if (!hasValue && !newValue) return tei;

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
    teiId?: Id;
    program: NamedRef;
    orgUnit: NamedRef;
    dataElement: NamedRef;
    value: D2Value;
    valuePrev: string;
}

interface UpdateActionTeiAttribute {
    type: "teiAttribute";
    teiId: Id;
    eventId: Id;
    program: NamedRef;
    orgUnit: NamedRef;
    teiAttribute: NamedRef;
    value: D2Value;
    valuePrev: string;
}

const postOptions = { dryRun: false };

function diff<T>(objs1: T[], objs2: T[]): T[] {
    return _.differenceWith(objs1, objs2, _.isEqual);
}
