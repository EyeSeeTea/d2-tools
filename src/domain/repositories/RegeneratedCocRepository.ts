import { Id } from "domain/entities/Base";
import { RegeneratedCoc } from "domain/entities/RegeneratedCoc";
import { Stats } from "domain/entities/Stats";

export interface RegeneratedCocRepository {
    save(cocs: RegeneratedCoc[], options: { persist: boolean; persistInDisk: boolean }): Promise<Stats>;
    deleteByIds(cocIds: Id[], options: { persist: boolean }): Promise<Stats>;
}
