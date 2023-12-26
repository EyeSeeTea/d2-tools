import { UsersOptions } from "domain/entities/UserPermissions";

export interface ConfigRepositoryConstructor {
    new (): ConfigRepository;
}

export interface ConfigRepository {
    getConfig(): Promise<UsersOptions>;
}
