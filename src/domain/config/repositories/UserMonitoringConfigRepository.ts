import { UsersOptions } from "domain/entities/user-monitoring/common/UserOptions";

export interface UserMonitoringConfigRepository {
    get(): Promise<UsersOptions>;
}
