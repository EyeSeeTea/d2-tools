export type Id = string;

export type Ref = { id: Id };
export type Path = string;
export type Username = string;

export function getId<Obj extends Ref>(obj: Obj): Id {
    return obj.id;
}
