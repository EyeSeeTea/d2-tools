import _ from "lodash";
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
import { getData } from "data/dhis2-utils";
import log from "utils/log";
import { Event, EventsPostRequest } from "@eyeseetea/d2-api/api/events";
import { TrackedEntityInstance } from "@eyeseetea/d2-api/api/trackedEntityInstances";
import logger from "utils/log";

export class D2ProgramRules {
    constructor(private api: D2Api) {
        systemSettingsStore.set({
            dateFormat: "YYYY-MM-DDTHH:mm:ss.SSS",
        });
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
                    fields: ":all",
                })
            ).then(res => res.trackedEntityInstances);
        });
    }

    async run(options: { ids: Id[] }): Async<void> {
        const eventEffects = await this.getEventEffects(options);

        const eventsUpdated = eventEffects.map(eventEffect => {
            const { program, d2Event, effects } = eventEffect;
            const dataElementIdsInProgram = _(program.programStages)
                .flatMap(programStage => programStage.programStageDataElements)
                .map(psde => psde.dataElement)
                .map(de => de.id)
                .value();

            return effects.map((effect): D2EventToPost | undefined => {
                switch (effect.type) {
                    case "ASSIGN":
                        log.debug(`target=${effect.targetDataType}:${effect.id} value=${effect.value}`);

                        switch (effect.targetDataType) {
                            case "dataElement":
                                log.debug("D2ProgramRules: ASSIGN dataElement");
                                // TODO: update event.dataValues
                                const dataElementId = effect.id;
                                if (dataElementIdsInProgram.includes(dataElementId)) {
                                    return setDataValue(d2Event, dataElementId, effect.value);
                                } else {
                                    logger.debug(
                                        `Skip ASSIGN effect as dataElement ${dataElementId} does not belong to program ${program.id}`
                                    );
                                    return undefined;
                                }
                            case "trackedEntityAttribute":
                                // TODO: update tei.attributes
                                //log.debug("D2ProgramRules: ASSIGN trackedEntityAttribute");
                                throw new Error("TODO: trackedEntityAttribute");
                            default:
                                return undefined;
                        }
                    default:
                        return undefined;
                }
            });
        });

        const events1 = eventEffects.map(eventEffect => eventEffect.d2Event);
        const events2 = _.compact(_.flatten(eventsUpdated));

        console.log(events1, events2);
        const eventsWithChanges = _.differenceWith(events2, events1, _.isEqual);
        log.debug(`Events to post: ${eventsWithChanges.length}`);
    }

    async getEventEffects(options: { ids: Id[] }): Async<EventEffect[]> {
        const metadataQueryWithFilter = {
            ...metadataQuery,
            programs: { ...metadataQuery.programs, filter: { id: { in: options.ids } } },
        };
        const metadata = await getData(this.api.metadata.get(metadataQueryWithFilter));

        let output: EventEffect[] = [];

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

                const selectedEntity: TrackedEntityAttributeValuesMap | undefined = tei
                    ? _(tei.attributes)
                          .map(attr => [attr.attribute, attr.value] as [Id, string])
                          .fromPairs()
                          .value()
                    : undefined;

                log.debug("selectedEntity", tei?.created);

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
                            .filter(pr => pr.id === "mO8LQVZu84n") // Set age
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
                        programRuleVariables: metadata.programRuleVariables.map(variable => ({
                            ...variable,
                            programId: variable.program?.id,
                            dataElementId: variable.dataElement?.id,
                            trackedEntityAttributeId: variable.trackedEntityAttribute?.id,
                            programStageId: variable.programStage?.id,
                        })),
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

                const effects = getProgramRuleEffects(getEffectsOptions);
                log.debug(`Event: ${event.eventId} - #effects: ${effects.length}`);

                if (!_.isEmpty(effects)) {
                    output.push({ program, d2Event, event, effects });
                }
            }
        }

        console.log(
            JSON.stringify(
                _.flatMap(output, x => x.effects),
                null,
                4
            )
        );

        return output;
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

interface ProgramRulesContainer {
    programRuleVariables: ProgramRuleVariable[];
    programRules: ProgramRule[];
    constants?: Constant[];
}

export function runProgramRulesExample() {
    const constants: Constant[] = [];

    const dataElements: DataElementsMap = {
        oZg33kd9taw: { id: "oZg33kd9taw", valueType: "TEXT" },
    };

    const trackedEntityAttributes: TrackedEntityAttributesMap = {
        w75KJ2mc4zz: { id: "w75KJ2mc4zz", valueType: "TEXT" },
    };

    const programRules: ProgramRule[] = [
        {
            id: "g82J3xsNer9",
            condition: "true",
            displayName: "Testing the functions!",
            programId: "IpHINAT79UW",
            programRuleActions: [
                {
                    id: "Eeb7Ixr4Pvx",
                    dataElementId: "oZg33kd9taw",
                    data: "d2:round(d2:yearsBetween(A{birthYear},V{event_date}))",
                    programRuleActionType: "ASSIGN",
                },
            ],
        },
    ];

    const optionSets: OptionSetsMap = {};
    const orgUnit: OrgUnit = { id: "DiszpKrYNg8", name: "Ngelehun CHC", code: "", groups: [] };

    const programRuleVariables: ProgramRuleVariable[] = [
        {
            id: "RycV5uDi66i",
            trackedEntityAttributeId: "w75KJ2mc4zz",
            displayName: "birthYear",
            programId: "eBAyeGv0exc",
            programRuleVariableSourceType: "TEI_ATTRIBUTE",
            useNameForOptionSet: false,
        },
    ];

    const enrollmentData: Enrollment = { enrolledAt: "2020-05-14T22:00:00.000Z" };
    const teiValues: TrackedEntityAttributeValuesMap = { w75KJ2mc4zz: "2001" }; // Record<DataElementId, value>
    const currentEvent: ProgramEvent = {
        eventId: "ev1",
        orgUnitId: "DiszpKrYNg8",
        orgUnitName: "Ngelehun CHC",
        occurredAt: "2022-01-01T10:12:33.000Z",
    };
    const otherEvents: ProgramEvent[] = [];

    const options: GetProgramRuleEffectsOptions = {
        programRulesContainer: {
            programRules,
            programRuleVariables,
            constants,
        },
        currentEvent,
        otherEvents,
        dataElements,
        trackedEntityAttributes,
        selectedEntity: teiValues,
        selectedEnrollment: enrollmentData,
        selectedOrgUnit: orgUnit,
        optionSets,
    };

    return getProgramRuleEffects(options);
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
        fields: { id: true, valueType: true, optionSet: { id: true } },
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
} as const;

type Metadata = MetadataPick<typeof metadataQuery>;

interface D2Event extends Event {
    trackedEntityInstance: Id | undefined;
}

interface EventEffect {
    program: Metadata["programs"][number];
    event: ProgramEvent;
    d2Event: D2Event;
    effects: RuleEffect[];
}

function getProgramEvent(event: D2Event): ProgramEvent {
    const teiId = event.trackedEntityInstance;
    return {
        eventId: event.event,
        programId: event.program,
        programStageId: event.programStage,
        orgUnitId: event.orgUnit,
        orgUnitName: event.orgUnitName,
        status: event.status,
        occurredAt: event.eventDate,
        ...(teiId ? { trackedEntityInstanceId: teiId } : {}),
        scheduledAt: event.dueDate,
        ..._.fromPairs(event.dataValues.map(dv => [dv.dataElement, dv.value])),
    };
}

type D2EventToPost = EventsPostRequest["events"][number];
type D2DataValueToPost = D2EventToPost["dataValues"][number];

function setDataValue(
    event: D2Event,
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
