//
import {} from "react";

import { getValidators } from "../../validators";

export const convertPx = (options, value) => {
    const pxToRem = options && options.theme && options.theme.typography.pxToRem;
    return pxToRem ? pxToRem(value) : value;
};

export const commitEvents = {
    ON_BLUR: "onBlur",
};

export const getBaseConfigForField = metaData => ({
    id: metaData.id,
    validators: getValidators(metaData),
    commitEvent: commitEvents.ON_BLUR,
});
