import _ from "lodash";
import { Id, NamedRef, Path, Ref } from "./Base";
import { Struct } from "./generic/Struct";

export type OrgUnitAttrs = {
    id: Id;
    name: string;
    code: string;
    level: number;
    ancestors: NamedRef[]; // root-first; empty for the root org unit
    children: NamedRef[]; // empty ⇒ leaf
};

export class OrgUnit extends Struct<OrgUnitAttrs>() {
    get parent(): NamedRef | undefined {
        return _.last(this.ancestors);
    }

    get parentRef(): Ref | undefined {
        const parent = this.parent;
        return parent ? { id: parent.id } : undefined;
    }

    get isLeaf(): boolean {
        return _.isEmpty(this.children);
    }

    get path(): Path {
        return "/" + [...this.ancestors.map(ancestor => ancestor.id), this.id].join("/");
    }

    get namePath(): string {
        return [...this.ancestors.map(ancestor => ancestor.name), this.name].join(" / ");
    }

    rename(name: string): OrgUnit {
        return this._update({ name });
    }
}
