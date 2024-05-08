import _ from "lodash";

import { D2Api } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { PermissionFixerUserOptions } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerUserOptions";
import { PermissionFixerConfigRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerConfigRepository";
import { getObject } from "../common/GetDataStoreObjectByKey";

export class PermissionFixerConfigD2Repository implements PermissionFixerConfigRepository {
    private api: D2Api;
    private dataStoreKey = "user-monitoring";

    constructor(api: D2Api) {
        this.api = api;
    }

    public async get(): Promise<PermissionFixerUserOptions> {
        const config = await getObject<PermissionFixerUserOptions>(this.api, this.dataStoreKey);

        if (!config) {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }

        return config;
    }
}
