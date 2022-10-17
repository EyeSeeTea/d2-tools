//
import React from "react";
import moment from "moment";
import i18n from "@dhis2/d2-i18n";
import { Tag } from "@dhis2/ui";
import { dataElementTypes } from "../metaData";
import { convertMomentToDateFormatString } from "../utils/converters/date";
import { stringifyNumber } from "./common/stringifyNumber";
import { MinimalCoordinates } from "../components/MinimalCoordinates";

function convertDateForListDisplay(rawValue) {
    const momentDate = moment(rawValue);
    return convertMomentToDateFormatString(momentDate);
}

function convertDateTimeForListDisplay(rawValue) {
    const momentDate = moment(rawValue);
    const dateString = convertMomentToDateFormatString(momentDate);
    const timeString = momentDate.format("HH:mm");
    return `${dateString} ${timeString}`;
}

function convertTimeForListDisplay(rawValue) {
    const momentDate = moment(rawValue, "HH:mm", true);
    return momentDate.format("HH:mm");
}

function convertResourceForDisplay(clientValue) {
    return (
        <a
            href={clientValue.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={event => {
                event.stopPropagation();
            }}
        >
            {clientValue.name}
        </a>
    );
}

function convertRangeForDisplay(parser, clientValue) {
    return (
        <span>
            {parser(clientValue.from)} {"->"} {parser(clientValue.to)}
        </span>
    );
}
function convertNumberRangeForDisplay(clientValue) {
    return (
        <span>
            {clientValue.from} {"->"} {clientValue.to}
        </span>
    );
}

function convertStatusForDisplay(clientValue) {
    const { isNegative, isPositive, text } = clientValue;
    return (
        <Tag negative={isNegative} positive={isPositive}>
            {text}
        </Tag>
    );
}

const valueConvertersForType = {
    [dataElementTypes.NUMBER]: stringifyNumber,
    [dataElementTypes.INTEGER]: stringifyNumber,
    [dataElementTypes.INTEGER_POSITIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_ZERO_OR_POSITIVE]: stringifyNumber,
    [dataElementTypes.INTEGER_NEGATIVE]: stringifyNumber,
    [dataElementTypes.DATE]: convertDateForListDisplay,
    [dataElementTypes.DATE_RANGE]: value => convertRangeForDisplay(convertDateForListDisplay, value),
    [dataElementTypes.DATETIME]: convertDateTimeForListDisplay,
    [dataElementTypes.TIME]: convertTimeForListDisplay,
    [dataElementTypes.TRUE_ONLY]: () => i18n.t("Yes"),
    [dataElementTypes.BOOLEAN]: rawValue => (rawValue ? i18n.t("Yes") : i18n.t("No")),
    [dataElementTypes.COORDINATE]: MinimalCoordinates,
    [dataElementTypes.AGE]: convertDateForListDisplay,
    [dataElementTypes.FILE_RESOURCE]: convertResourceForDisplay,
    [dataElementTypes.IMAGE]: convertResourceForDisplay,
    [dataElementTypes.ORGANISATION_UNIT]: rawValue => rawValue.name,
    [dataElementTypes.ASSIGNEE]: rawValue => `${rawValue.name} (${rawValue.username})`,
    [dataElementTypes.NUMBER_RANGE]: convertNumberRangeForDisplay,
    [dataElementTypes.STATUS]: convertStatusForDisplay,
};

export function convertValue(value, type, dataElement) {
    if (!value && value !== 0 && value !== false) {
        return value;
    }

    if (dataElement && dataElement.optionSet) {
        return dataElement.optionSet.getOptionText(value);
    }

    // $FlowFixMe dataElementTypes flow error
    return valueConvertersForType[type] ? valueConvertersForType[type](value) : value;
}
