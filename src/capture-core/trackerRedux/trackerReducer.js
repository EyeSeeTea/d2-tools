//
import isDefined from "d2-utilizr/lib/isDefined";
import isArray from "d2-utilizr/lib/isArray";
import log from "loglevel";

import { environments } from "../constants/environments";

function updateStatePartInProduction(state, action, updatersForActionTypes, initValue) {
    if (!isDefined(state) || state === null) {
        state = initValue;
    }

    if (updatersForActionTypes[action.type]) {
        // $FlowFixMe[extra-arg] automated comment
        const newState = updatersForActionTypes[action.type](state, action);
        return newState;
    }

    // $FlowFixMe[incompatible-return] automated comment
    return state;
}

function updateStatePartInDevelopment(
    state,
    action,
    updatersForActionTypes,
    initValue,
    onUpdaterFound,
    onUpdaterExecuted
) {
    if (!isDefined(state) || state === null) {
        state = initValue;
    }

    if (updatersForActionTypes[action.type]) {
        onUpdaterFound(state, action);

        // $FlowFixMe[extra-arg] automated comment
        const newState = updatersForActionTypes[action.type](state, action);
        onUpdaterExecuted(state, action);
        return newState;
    }

    // $FlowFixMe[incompatible-return] automated comment
    return state;
}

const getUpdaterFoundFn = reducerDescription => (state, action) => {
    log.trace(
        `Updater for ${action.type} started in ${reducerDescription.name}. 
                Starting state is: ${JSON.stringify(state)}`
    );
};

const getUpdaterExecutedFn = reducerDescription => (state, action) => {
    log.trace(
        `Updater for ${action.type} executed in ${reducerDescription.name}. 
                New state is: ${JSON.stringify(state)}`
    );
};

const getProductionReducer = reducerDescription => (state, action) =>
    updateStatePartInProduction(state, action, reducerDescription.updaters, reducerDescription.initValue);

const createLogAction = action => {
    const payloadOverride =
        action.meta &&
        action.meta.skipLogging &&
        action.meta.skipLogging.reduce((accSkipLogging, item) => {
            accSkipLogging[item] = null;
            return accSkipLogging;
        }, {});

    return { ...action, payload: { ...action.payload, ...payloadOverride } };
};

const getDevelopmentReducer = reducerDescription => {
    const updaterFoundFn = getUpdaterFoundFn(reducerDescription);
    const updaterExecutedFn = getUpdaterExecutedFn(reducerDescription);
    return (state, action) => {
        const logAction = createLogAction(action);
        log.trace(`reducer ${reducerDescription.name} starting. Action is: ${JSON.stringify(logAction)}`);
        const newState = updateStatePartInDevelopment(
            state,
            action,
            reducerDescription.updaters,
            reducerDescription.initValue,
            updaterFoundFn,
            updaterExecutedFn
        );
        log.trace(`reducer ${reducerDescription.name} finished`);
        return newState;
    };
};

function wrapReducers(reducer, reducerWrappers) {
    if (isArray(reducerWrappers)) {
        // $FlowFixMe[prop-missing] automated comment
        return reducerWrappers.reduceRight(
            (prevReducer, currentReducer) => currentReducer(prevReducer),
            reducer
        );
    }

    // $FlowFixMe[not-a-function] automated comment
    return reducerWrappers(reducer);
}

function buildReducer(reducerDescription) {
    const currentEnvironment = process && process.env && process.env.NODE_ENV && process.env.NODE_ENV;

    let reducer =
        currentEnvironment === environments.prod
            ? getProductionReducer(reducerDescription)
            : getDevelopmentReducer(reducerDescription);

    if (reducerDescription.reducerWrappers) {
        reducer = wrapReducers(reducer, reducerDescription.reducerWrappers);
    }

    return reducer;
}

export function buildReducersFromDescriptions(reducerDescriptions) {
    const reducers = reducerDescriptions.reduce((accReducers, description) => {
        accReducers[description.name] = buildReducer(description);
        return accReducers;
    }, {});
    return reducers;
}

export function createReducerDescription(updaters, name, initValue = {}, reducerWrappers) {
    return {
        initValue,
        name,
        updaters,
        reducerWrappers,
    };
}
