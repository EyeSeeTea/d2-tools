import _ from "lodash";

import { D2Api } from "@eyeseetea/d2-api/2.36";
import log from "utils/log";
import { PermissionFixerMetadataConfig } from "domain/entities/user-monitoring/permission-fixer/PermissionFixerConfigOptions";
import { PermissionFixerConfigRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerConfigRepository";
import { getObject } from "../common/GetDataStoreObjectByKey";
import { Namespace, d2ToolsNamespace } from "data/externalConfig/Namespaces";
import { Async } from "domain/entities/Async";

export class PermissionFixerConfigD2Repository implements PermissionFixerConfigRepository {
    private api: D2Api;

    constructor(api: D2Api) {
        this.api = api;
    }

    public async get(): Async<PermissionFixerMetadataConfig> {
        const config = await getObject<PermissionFixerMetadataConfig>(
            this.api,
            d2ToolsNamespace,
            Namespace.PERMISSION_FIXER
        );

        if (!config) {
            log.warn("Error loading config from datastore");
            throw new Error("Error loading config from datastore");
        }

        return config;
    }
}
