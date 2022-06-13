export type Id = string;

export type Ref = { id: Id };

export function getId<Obj extends Ref>(obj: Obj): Id {
    return obj.id;
}
