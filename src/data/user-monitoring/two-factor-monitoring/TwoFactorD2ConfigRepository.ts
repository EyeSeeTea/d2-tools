import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { ConfigClient } from "domain/entities/user-monitoring/common/ConfigClient";
import log from "utils/log";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";
import { Namespace } from "data/externalConfig/Namespaces";
import { TwoFactorConfigRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorConfigRepository";

export class TwoFactorD2ConfigRepository implements TwoFactorConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    private async getObject<T extends object>(key: string): Promise<T | undefined> {
        const value = await this.api.dataStore("d2-tools").get<T>(key).getData();
        return value;
    }

    public async get(): Promise<TwoFactorUserOptions> {
        const config = await this.getObject<ConfigClient>(Namespace.USER_MONITORING);
        if (config) {
            const usersOptions = this.mapTemplates(config);
            return usersOptions;
        } else {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }
    }

    //for any reason the values aren't saved as ConfigClient, i must map it using the datastore namespaces
    public mapTemplates(config: any): TwoFactorUserOptions {
        return {
            pushProgramId: config[Namespace.PUSH_PROGRAM_ID],
            twoFactorGroup: config[Namespace.TWO_FACTOR_GROUP_ID],
        };
    }
}
