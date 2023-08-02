import { Id, Identifiable } from "domain/entities/Base";

export type SettingsOptions = {
    path: string;
};

export type DataSetMonitoring = {
    enable: boolean;
    orgUnit: Identifiable;
    period: string;
};

export type MonitoringConfig = {
    usersGroups: Identifiable[];
    monitoring: DataSetMonitoring[];
};

export type Settings = {
    dataSets: Record<Id, MonitoringConfig[]>;
};

export function extractNameSpaceAndKeyFromPath(path: string): [string, string] {
    const [namespace, key] = path.split(".");
    if (!namespace || !key) {
        throw Error(`Unable to get namespace and key from ${path}`);
    }
    return [namespace, key];
}
