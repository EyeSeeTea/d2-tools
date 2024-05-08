import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";
import { TwoFactorConfigRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorConfigRepository";
import { getObject } from "../common/GetDataStoreObjectByKey";

export class TwoFactorConfigD2Repository implements TwoFactorConfigRepository {
    private api: D2Api;
    private dataStoreKey = "two-factor-monitoring";

    constructor(api: D2Api) {
        this.api = api;
    }

    public async get(): Promise<TwoFactorUserOptions> {
        const config = await getObject<TwoFactorUserOptions>(this.api, this.dataStoreKey);

        if (!config) {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }

        return config;
    }
}
