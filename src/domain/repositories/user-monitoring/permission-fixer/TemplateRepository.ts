import { Async } from "domain/entities/Async";
import { TemplateGroupWithAuthorities } from "domain/entities/user-monitoring/common/Templates";
import { UsersOptions } from "domain/entities/user-monitoring/common/UserOptions";

export interface TemplateRepository {
    getTemplateAuthorities(options: UsersOptions): Promise<Async<TemplateGroupWithAuthorities[]>>;
}
