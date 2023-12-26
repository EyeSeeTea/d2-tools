import { UsersOptions } from "domain/entities/UserMonitoring";

export interface ConfigRepositoryConstructor {
    new (): ConfigRepository;
}

export interface ConfigRepository {
    getConfig(): Promise<UsersOptions>;
}
