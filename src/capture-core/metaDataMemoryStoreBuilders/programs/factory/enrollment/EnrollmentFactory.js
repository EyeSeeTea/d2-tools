//
/* eslint-disable no-underscore-dangle */
import log from "loglevel";
import i18n from "@dhis2/d2-i18n";
import { capitalizeFirstLetter } from "capture-core-utils/string/capitalizeFirstLetter";
import { errorCreator } from "capture-core-utils";

import { CustomForm, Enrollment, InputSearchGroup, RenderFoundation, Section } from "../../../../metaData";
import { DataElementFactory } from "./DataElementFactory";
import { getApi } from "../../../../d2/d2Instance";
import { DataElement } from "../../../../metaData/DataElement";

import { transformTrackerNode } from "../transformNodeFuntions/transformNodeFunctions";

export class EnrollmentFactory {
    static errorMessages = {
        CUSTOM_FORM_TEMPLATE_ERROR: "Error in custom form template",
    };

    static _addLabels(enrollment, cachedProgram) {
        if (cachedProgram.enrollmentDateLabel) {
            enrollment.enrollmentDateLabel = cachedProgram.enrollmentDateLabel;
        }
        if (cachedProgram.incidentDateLabel) {
            enrollment.incidentDateLabel = cachedProgram.incidentDateLabel;
        }
    }

    static _addFlags(enrollment, cachedProgram) {
        enrollment.allowFutureEnrollmentDate = cachedProgram.selectEnrollmentDatesInFuture;
        enrollment.allowFutureIncidentDate = cachedProgram.selectIncidentDatesInFuture;
        enrollment.showIncidentDate = cachedProgram.displayIncidentDate;
    }

    static _getFeatureType(cachedFeatureType) {
        return cachedFeatureType ? capitalizeFirstLetter(cachedFeatureType.toLowerCase()) : "None";
    }

    constructor({
        cachedTrackedEntityAttributes,
        cachedOptionSets,
        cachedTrackedEntityTypes,
        trackedEntityTypeCollection,
        locale,
    }) {
        this.locale = locale;
        this.trackedEntityTypeCollection = trackedEntityTypeCollection;
        this.cachedTrackedEntityAttributes = cachedTrackedEntityAttributes;
        this.cachedTrackedEntityTypes = cachedTrackedEntityTypes;
        this.dataElementFactory = new DataElementFactory({
            cachedTrackedEntityAttributes,
            cachedOptionSets,
            locale,
        });
    }

    _buildTetFeatureTypeField(trackedEntityTypeId) {
        const teType = trackedEntityTypeId && this.cachedTrackedEntityTypes.get(trackedEntityTypeId);
        if (!teType) {
            return null;
        }

        const featureType = teType.featureType;
        if (!featureType || !["POINT", "POLYGON"].includes(featureType)) {
            return null;
        }

        // $FlowFixMe
        return DataElementFactory.buildtetFeatureType(featureType);
    }

    async _buildTetFeatureTypeSection(cachedProgramTrackedEntityTypeId) {
        const featureTypeField = this._buildTetFeatureTypeField(cachedProgramTrackedEntityTypeId);
        const trackedEntityType = this.cachedTrackedEntityTypes.get(cachedProgramTrackedEntityTypeId);

        if (!featureTypeField) {
            return null;
        }

        const section = new Section(o => {
            o.id = cachedProgramTrackedEntityTypeId;
            o.name = trackedEntityType?.displayName || "";
        });

        featureTypeField && section.addElement(featureTypeField);
        return section;
    }

    async _buildMainSection(cachedProgramTrackedEntityAttributes, cachedProgramTrackedEntityTypeId) {
        const section = new Section(o => {
            o.id = Section.MAIN_SECTION_ID;
            o.name = i18n.t("Profile");
        });

        if (!cachedProgramTrackedEntityAttributes?.length) {
            return null;
        }

        if (cachedProgramTrackedEntityTypeId) {
            const featureTypeField = this._buildTetFeatureTypeField(cachedProgramTrackedEntityTypeId);
            featureTypeField && section.addElement(featureTypeField);
        }

        await this._buildElementsForSection(cachedProgramTrackedEntityAttributes, section);
        return section;
    }

    async _buildElementsForSection(cachedProgramTrackedEntityAttributes, section) {
        // $FlowFixMe
        await cachedProgramTrackedEntityAttributes.asyncForEach(async trackedEntityAttribute => {
            const element = await this.dataElementFactory.build(trackedEntityAttribute);
            element && section.addElement(element);
        });
        return section;
    }

    async _buildSection(
        cachedProgramTrackedEntityAttributes,
        cachedSectionCustomLabel,
        cachedSectionCustomId
    ) {
        if (!cachedProgramTrackedEntityAttributes?.length) {
            return null;
        }

        const section = new Section(o => {
            o.id = cachedSectionCustomId;
            o.name = cachedSectionCustomLabel;
        });

        await this._buildElementsForSection(cachedProgramTrackedEntityAttributes, section);
        return section;
    }

    async _buildCustomEnrollmentForm(enrollmentForm, dataEntryForm, cachedProgramTrackedEntityAttributes) {
        if (!cachedProgramTrackedEntityAttributes) {
            return null;
        }

        let section = new Section(o => {
            o.id = Section.MAIN_SECTION_ID;
        });

        section.showContainer = false;

        section = await this._buildElementsForSection(cachedProgramTrackedEntityAttributes, section);
        section && enrollmentForm.addSection(section);
        try {
            section.customForm = new CustomForm(o => {
                o.id = dataEntryForm.id;
            });
            section.customForm.setData(dataEntryForm.htmlCode, transformTrackerNode);
        } catch (error) {
            log.error(
                errorCreator(EnrollmentFactory.errorMessages.CUSTOM_FORM_TEMPLATE_ERROR)({
                    template: dataEntryForm.htmlCode,
                    error,
                    method: "buildEnrollment",
                })
            );
        }
        return enrollmentForm;
    }

    async _buildEnrollmentForm(cachedProgram, cachedProgramSections) {
        const cachedProgramTrackedEntityAttributes = cachedProgram?.programTrackedEntityAttributes;
        const enrollmentForm = new RenderFoundation(o => {
            o.featureType = EnrollmentFactory._getFeatureType(cachedProgram.featureType);
            o.name = cachedProgram.displayName;
        });

        let section;
        if (cachedProgram.dataEntryForm) {
            if (cachedProgram.trackedEntityTypeId) {
                section = await this._buildTetFeatureTypeSection(cachedProgram.trackedEntityTypeId);
                section && enrollmentForm.addSection(section);
            }

            await this._buildCustomEnrollmentForm(
                enrollmentForm,
                cachedProgram.dataEntryForm,
                cachedProgramTrackedEntityAttributes
            );
        } else if (cachedProgramSections?.length) {
            if (cachedProgram.trackedEntityTypeId) {
                section = await this._buildTetFeatureTypeSection(cachedProgram.trackedEntityTypeId);
                section && enrollmentForm.addSection(section);
            }

            // $FlowFixMe
            cachedProgramTrackedEntityAttributes &&
                cachedProgramSections.asyncForEach(async programSection => {
                    const trackedEntityAttributes = cachedProgramTrackedEntityAttributes.filter(
                        trackedEntityAttribute =>
                            programSection.trackedEntityAttributes.includes(
                                trackedEntityAttribute.trackedEntityAttributeId
                            )
                    );
                    section = await this._buildSection(
                        trackedEntityAttributes,
                        programSection.displayFormName,
                        programSection.id
                    );
                    section && enrollmentForm.addSection(section);
                });
        } else {
            section = await this._buildMainSection(
                cachedProgramTrackedEntityAttributes,
                cachedProgram.trackedEntityTypeId
            );
            section && enrollmentForm.addSection(section);
        }
        return enrollmentForm;
    }

    static _buildSearchGroupElement(searchGroupElement, teiAttribute) {
        const element = new DataElement(o => {
            o.id = searchGroupElement.id;
            o.name = searchGroupElement.name;
            o.shortName = searchGroupElement.shortName;
            o.formName = searchGroupElement.formName;
            o.description = searchGroupElement.description;
            o.displayInForms = true;
            o.displayInReports = searchGroupElement.displayInReports;
            o.compulsory = searchGroupElement.compulsory;
            o.disabled = searchGroupElement.disabled;
            o.type = teiAttribute.valueType;
            o.optionSet = searchGroupElement.optionSet;
        });
        return element;
    }

    _buildInputSearchGroupFoundation(cachedProgram, searchGroup) {
        const programTeiAttributes = cachedProgram.programTrackedEntityAttributes || [];
        const teiAttributesAsObject = programTeiAttributes.reduce((accTeiAttributes, programTeiAttribute) => {
            if (!programTeiAttribute.trackedEntityAttributeId) {
                log.error(
                    errorCreator("TrackedEntityAttributeId missing from programTrackedEntityAttribute")({
                        programTeiAttribute,
                    })
                );
                return accTeiAttributes;
            }
            const teiAttribute = this.cachedTrackedEntityAttributes.get(
                programTeiAttribute.trackedEntityAttributeId
            );
            if (!teiAttribute) {
                log.error(errorCreator("could not retrieve tei attribute")({ programTeiAttribute }));
            } else {
                accTeiAttributes[teiAttribute.id] = teiAttribute;
            }
            return accTeiAttributes;
        }, {});

        const searchGroupFoundation = searchGroup.searchForm;

        const foundation = new RenderFoundation();
        const section = new Section(oSection => {
            oSection.id = Section.MAIN_SECTION_ID;
        });
        Array.from(
            searchGroupFoundation
                .getSection(Section.MAIN_SECTION_ID)
                // $FlowFixMe : there should be one
                .elements.entries()
        )
            .map(entry => entry[1])
            .forEach(e => {
                const element = EnrollmentFactory._buildSearchGroupElement(e, teiAttributesAsObject[e.id]);
                element && section.addElement(element);
            });
        foundation.addSection(section);
        return foundation;
    }

    _buildInputSearchGroups(cachedProgram, programSearchGroups = []) {
        const inputSearchGroups = programSearchGroups
            .filter(searchGroup => !searchGroup.unique)
            .map(
                searchGroup =>
                    new InputSearchGroup(o => {
                        o.id = searchGroup.id;
                        o.minAttributesRequiredToSearch = searchGroup.minAttributesRequiredToSearch;
                        o.searchFoundation = this._buildInputSearchGroupFoundation(
                            cachedProgram,
                            searchGroup
                        );
                        o.onSearch = (values = {}, contextProps = {}) => {
                            const { orgUnitId, programId } = contextProps;
                            return getApi().get("trackedEntityInstances/count.json", {
                                ou: orgUnitId,
                                program: programId,
                                ouMode: "ACCESSIBLE",
                                filter: Object.keys(values)
                                    .filter(key => values[key] || values[key] === 0 || values[key] === false)
                                    .map(key => `${key}:LIKE:${values[key]}`),
                                pageSize: 1,
                                page: 1,
                                totalPages: true,
                            });
                        };
                    })
            );
        return inputSearchGroups;
    }

    async build(cachedProgram, programSearchGroups = []) {
        const enrollment = new Enrollment(o => {
            EnrollmentFactory._addLabels(o, cachedProgram);
            EnrollmentFactory._addFlags(o, cachedProgram);
            if (cachedProgram.trackedEntityTypeId) {
                const trackedEntityType = this.trackedEntityTypeCollection.get(
                    cachedProgram.trackedEntityTypeId
                );
                if (trackedEntityType) {
                    o.trackedEntityType = trackedEntityType;
                }
            }
            o.inputSearchGroups = this._buildInputSearchGroups(cachedProgram, programSearchGroups);
        });

        enrollment.enrollmentForm = await this._buildEnrollmentForm(
            cachedProgram,
            cachedProgram.programSections
        );
        return enrollment;
    }
}
