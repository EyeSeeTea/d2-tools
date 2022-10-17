//
/**
 * @module actionUtils
 */

/**
 * Generic action-creator
 * @param  {string} type - type of the action
 * @returns {function} a function accepting payload, meta and error -> returning an FSA-compliant action
 */
export function actionCreator(type) {
    return (payload, meta, error) => ({
        type,
        payload,
        meta,
        error,
    });
}

export function actionPayloadAppender(action) {
    return payload => ({
        ...action,
        payload: {
            ...action.payload,
            ...payload,
        },
    });
}
