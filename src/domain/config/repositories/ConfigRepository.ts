import { UsersOptions } from "domain/repositories/UsersRepository";

export interface ConfigRepositoryConstructor {
    new (): ConfigRepository;
}

export interface ConfigRepository {
    getConfig(): Promise<UsersOptions>;
}
