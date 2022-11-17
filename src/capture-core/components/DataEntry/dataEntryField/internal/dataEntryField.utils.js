//
import i18n from "@dhis2/d2-i18n";

export function getValidationError(value, validatorContainers) {
    if (!validatorContainers) {
        return null;
    }

    let message;
    const errorEncountered = validatorContainers.some(validatorContainer => {
        const validator = validatorContainer.validator;
        const result = validator(value);

        if (result === true || (result && result.valid)) {
            return false;
        }

        message = (result && result.message) || validatorContainer.message;
        return true;
    });

    return errorEncountered ? message || i18n.t("validation failed") : null;
}
