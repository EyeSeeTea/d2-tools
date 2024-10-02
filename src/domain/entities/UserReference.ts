import { NamedRef } from "domain/entities/Base";

/**
 * UserReference can be used for the createdBy, lastUpdatedBy, and other similar fields.
 */
export type UserReference = NamedRef & {
    displayName: string;
    username: string;
};
