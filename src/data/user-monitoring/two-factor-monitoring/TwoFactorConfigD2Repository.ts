import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { TwoFactorUserOptions } from "domain/entities/user-monitoring/two-factor-monitoring/TwoFactorUserOptions";
import { TwoFactorConfigRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorConfigRepository";
import { getObject } from "../common/GetDataStoreObjectByKey";
import { Namespace, d2ToolsNamespace } from "data/externalConfig/Namespaces";
import { Async } from "domain/entities/Async";

export class TwoFactorConfigD2Repository implements TwoFactorConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    public async get(): Async<TwoFactorUserOptions> {
        const config = await getObject<TwoFactorUserOptions>(
            this.api,
            d2ToolsNamespace,
            Namespace.TWO_FACTOR_MONITORING
        );

        if (!config) {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }

        return config;
    }
}
