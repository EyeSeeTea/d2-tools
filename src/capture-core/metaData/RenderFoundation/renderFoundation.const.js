//

export const validationStrategies = {
    NONE: "none",
    ON_UPDATE_AND_INSERT: "onUpdateAndInsert",
    ON_COMPLETE: "onComplete",
};

export const validationStrategiesAsArray = Object.keys(validationStrategies).map(
    key => validationStrategies[key]
);
