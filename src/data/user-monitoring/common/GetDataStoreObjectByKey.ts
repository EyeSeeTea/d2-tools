import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Namespace } from "data/externalConfig/Namespaces";

export async function getObject<T extends object>(api: D2Api, key: string): Promise<T | undefined> {
    const value = await api.dataStore(Namespace.D2_TOOLS).get<T>(key).getData();
    return value;
}
