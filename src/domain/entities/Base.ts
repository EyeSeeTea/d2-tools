export type Id = string;

export type Ref = { id: Id };

export type NamedRef = { id: Id; name: string };

export function getId(obj: Ref): Id {
    return obj.id;
}
