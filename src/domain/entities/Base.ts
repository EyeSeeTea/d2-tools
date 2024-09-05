import _ from "lodash";

export type Id = string;
export type Ref = { id: Id };
export type NamedRef = { id: Id; name: string };

export type Path = string;
export type Username = string;
export type StringDateTime = string;

export type IndexedById<T> = Record<Id, T>;

export function indexById<T extends Ref>(objs: T[]): Record<Id, T> {
    return _.keyBy(objs, obj => obj.id);
}

export function getId<Obj extends Ref>(obj: Obj): Id {
    return obj.id;
}

export type Code = string;
export type Name = string;
export type IdAccess = { id: Id; access: string };

export type Identifiable = Id | Code | Name;
