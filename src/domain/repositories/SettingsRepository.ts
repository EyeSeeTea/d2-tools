import { Async } from "domain/entities/Async";
import { Id, Path } from "domain/entities/Base";

export interface SettingsRepository {
    get(options: SettingsOptions): Async<Settings>;
}

export type SettingsOptions = {
    namespace: string;
    path: Path;
};

export type DataSetMonitoring = {
    enable: boolean;
    orgUnit: Id;
    period: string;
};

export type MonitoringConfig = {
    userGroup: string;
    monitoring: DataSetMonitoring[];
};

export type Settings = {
    dataSets: Record<string, MonitoringConfig>;
};
