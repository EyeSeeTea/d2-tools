import _ from "lodash";

export type Id = string;
export type Ref = { id: Id };
export type Path = string;
export type Username = string;

export type IndexedById<T> = Record<Id, T>;

export interface NamedRef extends Ref {
    name: string;
}

export function indexById<T extends Ref>(objs: T[]): Record<Id, T> {
    return _.keyBy(objs, obj => obj.id);
}
