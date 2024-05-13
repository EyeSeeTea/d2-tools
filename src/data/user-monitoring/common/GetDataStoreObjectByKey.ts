import { D2Api } from "@eyeseetea/d2-api/2.36";

export async function getObject<T extends object>(
    api: D2Api,
    dataStore: string,
    key: string
): Promise<T | undefined> {
    const value = await api.dataStore(dataStore).get<T>(key).getData();
    return value;
}
