export type Access = {
    read: boolean;
    update: boolean;
    externalize: boolean;
    write: boolean;
    delete: boolean;
    manage: boolean;
};

export type UserAccess = {
    access: AccessString;
    displayName: string;
    id: string;
    userUid: string;
};

export type UserGroupAccess = {
    access: AccessString;
    displayName: string;
    id: string;
    userGroupUid: string;
};

/**
 * AccessString stores sharing access rights.
 * The first two characters represent read and write access for metadata.
 * The second set of characters represent read and write access for data.
 */
// TODO: is it worth using the template?
// export type AccessString = `${"r" | "-"}${"w" | "-"}${"r" | "-"}${"w" | "-"}----`;
export type AccessString = string;
