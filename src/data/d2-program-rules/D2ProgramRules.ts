import _ from "lodash";
import fs from "fs";
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
import { D2Event as Event, EventsPostRequest, EventsPostResponse } from "@eyeseetea/d2-api/api/events";
import {
    Attribute,
    TeiOuRequest,
    TeiPostResponse,
    TrackedEntityInstance,
} from "@eyeseetea/d2-api/api/trackedEntityInstances";
import { assert, fromPairs, Maybe } from "utils/ts-utils";
import { RunRulesOptions } from "domain/repositories/ProgramsRepository";
import { HttpResponse } from "@eyeseetea/d2-api/api/common";
import { getId } from "domain/entities/Base";

export class D2ProgramRules {
    constructor(private api: D2Api) {
        systemSettingsStore.set({
            dateFormat: "YYYY-MM-DD",
        });
    }

    async run(options: RunRulesOptions): Async<void> {
        const { post, reportPath } = options;

        const metadata = await this.getMetadata(options);
        const allActions: UpdateAction[] = [];
        let index = 1;

        await this.getEventEffects(metadata, options, async eventEffects => {
            const actions = this.getActions(eventEffects, metadata);

            const eventsCurrent = _.flatMap(eventEffects, eventEffect => eventEffect.events);
            const eventsById = _.keyBy(eventsCurrent, event => event.event);
            const eventsUpdated = this.getUpdatedEvents(actions, eventsById);
            const eventsWithChanges = diff(eventsUpdated, eventsCurrent);

            const teisCurrent = _.compact(eventEffects.map(eventEffect => eventEffect.tei));
            const teisUpdated: TrackedEntityInstance[] = this.getUpdatedTeis(teisCurrent, actions);
            const teisWithChanges = diff(teisUpdated, teisCurrent);

            log.info(`Changes: events=${eventsWithChanges.length}, teis=${teisWithChanges.length}`);

            this.savePayloads(options, {
                index: index,
                eventsCurrent,
                eventsWithChanges,
                teisCurrent,
                teisWithChanges,
            });

            if (post) {
                log.info("POST changes");
                await this.postEvents(eventsWithChanges);
                await this.postTeis(teisWithChanges);
            }

            allActions.push(...actions);
            index++;
        });

        if (reportPath) {
            await this.saveReport(reportPath, allActions);
        }
    }

    savePayloads(
        rulesOptions: RunRulesOptions,
        options: {
            index: number;
            eventsCurrent: D2Event[];
            eventsWithChanges: D2EventToPost[];
            teisCurrent: TrackedEntityInstance[];
            teisWithChanges: TrackedEntityInstance[];
        }
    ) {
        const { index, eventsCurrent, eventsWithChanges, teisCurrent, teisWithChanges } = options;

        if (rulesOptions.payloadPath) {
            const payloadPath = rulesOptions.payloadPath.replace("%i", index.toString().padStart(3, "0"));

            if (rulesOptions.backup) {
                const backupPath = payloadPath.replace(".json", "-backup.json");

                const backupPayload = {
                    events: _(eventsCurrent)
                        .keyBy(ev => ev.event)
                        .at(eventsWithChanges.map(ev => assert(ev.event)))
                        .compact()
                        .value(),
                    trackedEntityInstances: _(teisCurrent)
                        .keyBy(ev => ev.trackedEntityInstance)
                        .at(teisWithChanges.map(ev => assert(ev.trackedEntityInstance)))
                        .compact()
                        .value(),
                };

                fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 4));
                log.info(`Backup saved: ${backupPath}`);
            }

            const payload = {
                events: eventsWithChanges,
                trackedEntityInstances: teisWithChanges,
            };

            fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 4));
            log.info(`Payload saved: ${payloadPath}`);
        }
    }

    private async getMetadata(options: RunRulesOptions): Promise<Metadata> {
        log.debug("Get metadata for programs");

        const baseMetadata = await getData(
            this.api.metadata.get({
                ...metadataQuery,
                programs: { ...metadataQuery.programs, filter: { id: { in: options.programIds } } },
            })
        );

        return {
            ...baseMetadata,
            dataElementsById: _.keyBy(baseMetadata.dataElements, de => de.id),
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

                const eventUpdated = actions.reduce((accEvent, action): D2EventToPost => {
                    return event ? setDataValue(accEvent, action.dataElement.id, action.value) : accEvent;
                }, event as D2EventToPost);

                return eventUpdated;
            })
            .value();
    }

    private getActions(eventEffects: EventEffect[], metadata: Metadata): UpdateAction[] {
        return _(eventEffects)
            .flatMap(eventEffect => {
                return _(eventEffect.effects)
                    .flatMap(ruleEffect => this.getUpdateAction(ruleEffect, eventEffect, metadata))
                    .value();
            })
            .uniqWith(_.isEqual)
            .value();
    }

    private getUpdateAction(
        effect: RuleEffect,
        eventEffect: EventEffect,
        metadata: Metadata
    ): UpdateAction[] {
        const { program, event, events, tei } = eventEffect;

        switch (effect.type) {
            case "ASSIGN":
                log.debug(`Effect ${effect.type} ${effect.targetDataType}:${effect.id} -> ${effect.value}`);

                switch (effect.targetDataType) {
                    case "dataElement":
                        return _(events)
                            .map(event =>
                                getUpdateActionEvent(metadata, program, event, effect.id, effect.value)
                            )
                            .compact()
                            .value();
                    case "trackedEntityAttribute":
                        if (!tei) {
                            log.error("No TEI to assign effect to");
                            return [];
                        } else {
                            return _.compact([getUpdateActionTeiAttribute(program, event, tei, effect)]);
                        }
                    default:
                        return [];
                }
            default:
                return [];
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

    private async saveReport(reportPath: string, actions: UpdateAction[]) {
        type Attr =
            | "actionType"
            | "program"
            | "programStage"
            | "orgUnit"
            | "eventId"
            | "dataElement"
            | "teiId"
            | "teiAttribute"
            | "value"
            | "valuePrev";

        type Row = Record<Attr, string>;

        const createCsvWriter = CsvWriter.createObjectCsvWriter;

        const header: Array<{ id: Attr; title: string }> = [
            { id: "program", title: "Program" },
            { id: "programStage", title: "Program Stage" },
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

        const formatObj = (obj: NamedRef | undefined) => (obj ? `${obj.name.trim()} [${obj.id}]` : "-");

        const records = actions.map((action): Row | undefined => {
            const valueChanged = action.value != action.valuePrev;
            if (!valueChanged) return;

            return {
                program: formatObj(action.program),
                programStage: formatObj(action.programStage),
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
        console.debug(`Programs: ${metadata.programs.map(getId).join(", ")}`);

        for (const program of metadata.programs) {
            switch (program.programType) {
                case "WITHOUT_REGISTRATION":
                    await this.getEventEffectsForProgram({ program, metadata }, options, onEffects);
                    break;
                case "WITH_REGISTRATION":
                    await this.getEventEffectsForTrackerProgram({ program, metadata }, options, onEffects);
                    break;
            }
        }
    }

    private async getEventEffectsForProgram(
        options: { program: Program; metadata: Metadata },
        runOptions: RunRulesOptions,
        onEffects: (eventEffects: EventEffect[]) => void
    ): Promise<void> {
        const { program, metadata } = options;
        const { startDate, endDate, orgUnitsIds, orgUnitGroupIds, programRulesIds } = runOptions;

        log.info(`Get data for events program: [${program.id}] ${program.name}`);

        const orgUnitsIdsFromOu = orgUnitsIds || [];
        const orgUnitIdsFromGroups = await this.getOrgUnitIdsFromGroups(orgUnitGroupIds);
        const orgUnitIds = _.concat(orgUnitsIdsFromOu, orgUnitIdsFromGroups);
        const orgUnitsIter = _.isEmpty(orgUnitIds) ? [undefined] : orgUnitIds;
        log.info(`Org unit IDs: ${orgUnitIds.join(", ") || "-"}`);

        for (const orgUnit of orgUnitsIter) {
            const data: Pick<Data, "events"> = { events: [] };

            await this.getPaginated(async page => {
                log.info(
                    [
                        "Get events:",
                        `program=${program.id}`,
                        `orgUnit=${orgUnit || "-"}`,
                        `startDate=${startDate}`,
                        `endDate=${endDate}`,
                        `page=${page}`,
                    ].join(" ")
                );

                const events = await getData(
                    this.api.events.get({
                        program: program.id,
                        orgUnit,
                        startDate,
                        endDate,
                        page,
                        pageSize: 1_000,
                        totalPages: false,
                        trackedEntityInstance: runOptions.teiId,
                        fields: { $all: true },
                    })
                ).then(res => res.events as D2Event[]);

                if (_.isEmpty(events)) return [];

                log.info(`Events: ${events.length}`);

                const teiIds = _(events)
                    .map(event => event.trackedEntityInstance)
                    .compact()
                    .uniq()
                    .value();

                log.debug(`Get tracked entities for events: ${teiIds.length}`);
                const teis = await this.getTeis(teiIds);
                log.info(`Tracked entities: ${teis.length}`);

                data.events.push(...events);

                return events;
            });

            const eventsGroups = _(data.events)
                .filter(ev => Boolean(ev.eventDate))
                .groupBy(ev =>
                    [ev.orgUnit, ev.program, ev.attributeOptionCombo, ev.trackedEntityInstance].join(".")
                )
                .values()
                .value();

            log.info(`Start rules processing: #events=${data.events.length}`);

            const eventEffects = _(eventsGroups)
                .flatMap(events => {
                    return events.map(event => {
                        return this.getEffects({
                            event,
                            program,
                            programRulesIds,
                            metadata,
                            tei: undefined,
                            teis: [],
                            events,
                        });
                    });
                })
                .compact()
                .value();

            onEffects(eventEffects);
        }
    }

    private async getOrgUnitIdsFromGroups(orgUnitGroupIds: Maybe<Id[]>): Promise<Id[]> {
        if (_.isEmpty(orgUnitGroupIds)) return [];

        const res = await getData(
            this.api.metadata.get({
                organisationUnitGroups: {
                    fields: { organisationUnits: { id: true } },
                    filter: { id: { in: orgUnitGroupIds } },
                },
            })
        );

        return _(res.organisationUnitGroups)
            .flatMap(orgUnitGroup => orgUnitGroup.organisationUnits)
            .map(getId)
            .value();
    }

    private async getEventEffectsForTrackerProgram(
        options: { program: Program; metadata: Metadata },
        runOptions: RunRulesOptions,
        onEffects: (eventEffects: EventEffect[]) => void
    ): Promise<void> {
        const { program, metadata } = options;
        const { startDate, endDate, orgUnitsIds, programRulesIds } = runOptions;

        log.info(`Get data for tracker program: [${program.id}] ${program.name}`);
        let page = 1;
        const pageSize = 100;
        let total: Maybe<{ pages: number; count: number }>;

        const base = { program, programRulesIds, metadata };

        do {
            log.info(
                [
                    "Get TEIs:",
                    `program=${program.id}`,
                    `programRules=${programRulesIds?.join(", ")}`,
                    `enrollment-startDate=${startDate}`,
                    `enrollment-endDate=${endDate}`,
                    `page-size=${pageSize}`,
                    `total=${total?.count || "-"}`,
                    `total-pages=${total?.pages || "-"}`,
                    `[page=${page}]`,
                ].join(" ")
            );

            const orgUnitsFilter: TeiOuRequest = orgUnitsIds
                ? { ou: orgUnitsIds, ouMode: "SELECTED" }
                : { ouMode: "ALL" };

            const res = await getData(
                this.api.trackedEntityInstances.get({
                    program: program.id,
                    order: "id:asc",
                    ...orgUnitsFilter,
                    fields: "*,enrollments[events]",
                    programStartDate: startDate,
                    programEndDate: endDate,
                    trackedEntityInstance: runOptions.teiId,
                    totalPages: true,
                    page: page,
                    pageSize: pageSize,
                })
            );

            const teis = (res.trackedEntityInstances as unknown as TeiWithEvents[]).filter(
                tei => !runOptions.teiId || runOptions.teiId === tei.trackedEntityInstance
            );
            const pager = res.pager;
            total = { pages: pager.pageCount, count: pager.total };

            const eventsCount = _(teis)
                .flatMap(tei => tei.enrollments)
                .flatMap(enrollment => enrollment.events)
                .size();
            log.info(`Run rules engine: TEIs=${teis.length} events=${eventsCount}`);

            const eventEffects = _(teis)
                .flatMap(tei => {
                    const teiEvents = _.flatMap(tei.enrollments, enrollment => enrollment.events);

                    return teiEvents
                        .filter(event => Boolean(event.eventDate))
                        .map(event => this.getEffects({ ...base, event, tei, teis, events: teiEvents }));
                })
                .compact()
                .value();

            onEffects(eventEffects);

            page++;
        } while (page <= total.pages);
    }

    private getEffects(options: {
        event: D2Event;
        program: Program;
        programRulesIds: Maybe<Id[]>;
        metadata: Metadata;
        teis: TrackedEntityInstance[];
        tei: Maybe<TrackedEntityInstance>;
        events: D2Event[];
    }): Maybe<EventEffect> {
        const { event: d2Event, program, programRulesIds, metadata, teis, tei, events } = options;
        const allEvents = events.map(event => getProgramEvent(event, metadata));
        const event = getProgramEvent(d2Event, metadata);

        const enrollmentsById = _(teis)
            .flatMap(tei => tei.enrollments)
            .keyBy(enrollment => enrollment.enrollment)
            .value();

        const enrollment = event.enrollmentId ? enrollmentsById[event.enrollmentId] : undefined;

        log.debug(`Process event: ${event.eventId}`);

        const selectedEntity: TrackedEntityAttributeValuesMap | undefined = tei
            ? _(tei.attributes)
                  .map(attr => [attr.attribute, attr.value] as [Id, string])
                  .fromPairs()
                  .value()
            : undefined;

        const selectedOrgUnit: OrgUnit = {
            id: event.orgUnitId,
            name: event.orgUnitName,
            code: "",
            groups: [],
        };
        const getEffectsOptions: GetProgramRuleEffectsOptions = {
            currentEvent: event,
            otherEvents: allEvents,
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

        const [effects, errors] = captureConsoleError(() => {
            return getProgramRuleEffects(getEffectsOptions).filter(effect => effect.type === "ASSIGN");
        });

        if (errors) {
            log.error(
                _.compact([
                    "Get effects [error]:",
                    `eventId=${event.eventId}`,
                    tei ? `tei=${tei.trackedEntityInstance || "-"}` : null,
                    ":",
                    errors.join(", "),
                ]).join(" ")
            );

            // Skip effect if there were errors (as the engine still returns a value)
            return undefined;
        }

        log.debug(
            _.compact([
                "Get effects[results]:",
                `eventId=${event.eventId}`,
                tei ? `tei=${tei.trackedEntityInstance || "-"}` : null,
                `ASSIGNs: ${effects.length}`,
            ]).join(" ")
        );

        if (!_.isEmpty(effects)) {
            const eventEffect: EventEffect = {
                program,
                event: d2Event,
                events: events,
                effects,
                orgUnit: selectedOrgUnit,
                tei,
            };

            return eventEffect;
        } else {
            return undefined;
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

    private async getTeis(ids: Id[]): Async<TrackedEntityInstance[]> {
        return getInChunks(ids, groupOfIds => {
            return getData(
                this.api.trackedEntityInstances.get({
                    ouMode: "ALL",
                    trackedEntityInstance: groupOfIds.join(";"),
                    fields: "*",
                    totalPages: true,
                })
            )
                .then(res => res.trackedEntityInstances)
                .catch(() => {
                    log.error(`Error getting TEIs: ${ids.join(",")}. Fallback to empty set`);
                    return [];
                });
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
            programType: true,
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

interface EventEffect {
    program: Program;
    event: D2Event;
    events: D2Event[];
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
        eventDate: event.eventDate,
        occurredAt: event.eventDate,
        trackedEntityInstanceId: teiId,
        scheduledAt: event.dueDate,
        // Add data values: Record<DataElementId, Value>
        ...fromPairs(
            event.dataValues.map(dv => {
                const dataElement = metadata.dataElementsById[dv.dataElement];
                const valueType = dataElement?.valueType;
                // program rule expressions expect booleans (true/false) not strings ('true'/'false')
                const isBoolean = valueType && ["BOOLEAN", "TRUE_ONLY"].includes(valueType);
                const value = isBoolean ? dv.value.toString() === "true" : dv.value;
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
    const programStagesNamedRefById = _.keyBy(program.programStages, programStage => programStage.id);

    const eventMatchesProgramStage = program.programStages
        .filter(programStage =>
            _(programStage.programStageDataElements).some(psde => psde.dataElement.id === dataElementId)
        )
        .some(programStageContainingDE => programStageContainingDE.id === event.programStage);

    if (!eventMatchesProgramStage) {
        log.debug(
            `Skip ASSIGN effect for event:${event.event} as dataElement:${dataElementId} not in event.programStage:${event.programStage}`
        );

        return undefined;
    } else {
        const strValue = value === null || value === undefined ? "" : value.toString();

        return {
            type: "event",
            eventId: event.event,
            teiId: event.trackedEntityInstance,
            program,
            programStage: programStagesNamedRefById[event.programStage],
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
    const programStagesNamedRefById = _.keyBy(program.programStages, programStage => programStage.id);

    if (!attributeIdsInProgram.has(attributeId)) {
        log.debug(`Skip ASSIGN effect as attribute ${attributeId} does not belong to program`);
        return undefined;
    } else {
        const strValue = value === null || value === undefined ? "" : value.toString();
        return {
            type: "teiAttribute",
            eventId: event.event,
            teiId: tei.trackedEntityInstance,
            program,
            programStage: programStagesNamedRefById[event.programStage],
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
    programStage?: NamedRef;
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
    programStage?: NamedRef;
    orgUnit: NamedRef;
    teiAttribute: NamedRef;
    value: D2Value;
    valuePrev: string;
}

const postOptions = { dryRun: false };

function diff<T>(objs1: T[], objs2: T[]): T[] {
    return _.differenceWith(objs1, objs2, _.isEqual);
}

interface Data {
    events: D2Event[];
    teis: TrackedEntityInstance[];
}

type TeiWithEvents = TrackedEntityInstance & {
    trackedEntityInstance: Id;
    enrollments: Array<{ events: D2Event[] }>;
};

function captureConsoleError<U>(fn: () => U): [U, Maybe<string[]>] {
    const errors: string[] = [];
    const prevConsoleError = console.error;
    console.error = (msg: string) => errors.push(msg);
    const res = fn();
    console.error = prevConsoleError;
    return [res, errors.length > 0 ? errors : undefined];
}
