import { Id } from "@eyeseetea/d2-api";
import { Async } from "domain/entities/Async";

export interface UsersRepository {
    checkPermissions(options: UsersOptions): Async<void>;
}

export interface TemplateGroup{
    templateId: Id;
    groupId: Id;
}

export interface UsersOptions {
    templates: TemplateGroup[];
}
