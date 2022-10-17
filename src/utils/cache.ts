import { FileSystemCache } from "file-system-cache";

export class FileCache {
    constructor(private cacheStore: FileSystemCache) {}

    async cache<T>(getter: () => Promise<T>, objKey: object): Promise<T> {
        const { cacheStore } = this;
        const key = JSON.stringify(objKey);
        const valueFromCache = await cacheStore.get(key);
        if (valueFromCache) {
            return valueFromCache;
        } else {
            const value = await getter();
            cacheStore.set(key, value);
            return value;
        }
    }
}
