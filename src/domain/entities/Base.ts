export type Id = string;
export type Ref = { id: Id };
export type Path = string;
export type Username = string;

export interface NamedRef extends Ref {
    name: string;
}
