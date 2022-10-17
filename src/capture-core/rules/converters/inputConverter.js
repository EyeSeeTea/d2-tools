//
/* eslint-disable class-methods-use-this */
import log from "loglevel";
import { parseNumber } from "capture-core-utils/parsers";
import moment from "moment";

const dateMomentFormat = "YYYY-MM-DD";

class RulesValueConverter {
    convertText(value) {
        return value || "";
    }

    convertLongText(value) {
        return value || "";
    }

    convertLetter(value) {
        return value || "";
    }

    convertPhoneNumber(value) {
        return value || "";
    }

    convertEmail(value) {
        return value || "";
    }

    convertBoolean(value) {
        return value || value === false ? value : "";
    }

    convertTrueOnly(value) {
        return value || value === false ? value : "";
    }

    convertDate(value) {
        if (!value) {
            return "";
        }
        const momentObject = moment(value);
        momentObject.locale("en");
        return momentObject.format(dateMomentFormat);
    }

    convertDateTime(value) {
        return value || "";
    }

    convertTime(value) {
        return value || "";
    }

    convertNumber(value) {
        return value || 0;
    }

    convertUnitInterval(value) {
        return value || 0;
    }

    convertPercentage(value) {
        if (!value) {
            return 0;
        }
        const numberValue = parseNumber(value);
        if (isNaN(numberValue)) {
            return 0;
        }

        return numberValue / 100;
    }

    convertInteger(value) {
        return value || 0;
    }

    convertIntegerPositive(value) {
        return value || 0;
    }

    convertIntegerNegative(value) {
        return value || 0;
    }

    convertIntegerZeroOrPositive(value) {
        return value || 0;
    }

    convertTrackerAssociate(value) {
        log.warn("convertTrackerAssociate not implemented", value);
        return "";
    }

    convertUserName(value) {
        log.warn("convertUserName not implemented", value);
        return "";
    }

    convertCoordinate(value) {
        log.warn("convertCoordinate not implemented", value);
        return "";
    }

    convertOrganisationUnit(value) {
        log.warn("convertOrganisationUnit not implemented", value);
        return "";
    }

    convertAge(value) {
        return this.convertDate(value);
    }

    convertUrl(value) {
        return value || "";
    }

    convertFile(value) {
        log.warn("convertFile not implemented", value);
        return "";
    }

    convertImage(value) {
        log.warn("convertImage not implemented", value);
        return "";
    }
}

export const inputConverter = new RulesValueConverter();
