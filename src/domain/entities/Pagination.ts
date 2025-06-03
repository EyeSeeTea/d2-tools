import { Pager } from "./Pager";

export type Paginated<T> = {
    objects: T[];
    pager: Pager;
};
