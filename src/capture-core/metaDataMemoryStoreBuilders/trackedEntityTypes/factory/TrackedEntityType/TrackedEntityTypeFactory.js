//
/* eslint-disable no-underscore-dangle */
import { TrackedEntityType } from "../../../../metaData";
import { DataElementFactory } from "./DataElementFactory";
import { TeiRegistrationFactory } from "./TeiRegistrationFactory";
import { SearchGroupFactory } from "../../../common/factory";

export class TrackedEntityTypeFactory {
    static translationPropertyNames = {
        NAME: "NAME",
        SHORT_NAME: "SHORT_NAME",
        DESCRIPTION: "DESCRIPTION",
    };

    constructor(cachedTrackedEntityAttributes, cachedOptionSets, locale) {
        this.locale = locale;
        this.dataElementFactory = new DataElementFactory({
            cachedTrackedEntityAttributes,
            cachedOptionSets,
            locale,
        });
        this.searchGroupFactory = new SearchGroupFactory({
            cachedTrackedEntityAttributes,
            cachedOptionSets,
            locale,
        });
        this.teiRegistrationFactory = new TeiRegistrationFactory({
            cachedTrackedEntityAttributes,
            cachedOptionSets,
            locale,
        });
    }

    _getTranslation(translations, property) {
        if (this.locale) {
            const translation = translations.find(t => t.property === property && t.locale === this.locale);
            return translation && translation.value;
        }
        return null;
    }

    async _buildAttributes(cachedTrackedEntityTypeAttributes) {
        const attributePromises = cachedTrackedEntityTypeAttributes.map(async teta => {
            const attribute = await this.dataElementFactory.build(teta);
            return attribute;
        });
        const attributes = await Promise.all(attributePromises);

        return attributes.filter(a => a);
    }

    async build(cachedType) {
        const trackedEntityType = new TrackedEntityType(o => {
            o.id = cachedType.id;
            o.access = cachedType.access;
            o.name =
                this._getTranslation(
                    cachedType.translations,
                    TrackedEntityTypeFactory.translationPropertyNames.NAME
                ) || cachedType.displayName;
        });

        if (cachedType.trackedEntityTypeAttributes) {
            trackedEntityType.searchGroups = await this.searchGroupFactory.build(
                cachedType.trackedEntityTypeAttributes,
                cachedType.minAttributesRequiredToSearch
            );
            // $FlowFixMe
            trackedEntityType.attributes = await this._buildAttributes(
                cachedType.trackedEntityTypeAttributes
            );
        }

        trackedEntityType.teiRegistration = await this.teiRegistrationFactory.build(
            cachedType,
            trackedEntityType.searchGroups,
            trackedEntityType
        );

        return trackedEntityType;
    }
}
