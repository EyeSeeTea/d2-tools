//
import isArray from "d2-utilizr/lib/isArray";

export const filterByInnerAction = (action, batchActionType, innerActionType) =>
    action.type !== batchActionType ||
    (isArray(action.payload) && action.payload.some(ba => ba.type === innerActionType));

export const mapToInnerAction = (action, batchActionType, innerActionType) =>
    action.type === batchActionType && isArray(action.payload)
        ? action.payload.find(ba => ba.type === innerActionType)
        : action;
