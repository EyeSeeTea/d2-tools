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
    userGroups: Identifiable[];
    monitoring: DataSetMonitoring[];
};

export type Settings = {
    dataSets: Record<Id, MonitoringConfig[]>;
};
