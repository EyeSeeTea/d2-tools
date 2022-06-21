import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Locale } from "domain/entities/Locale";
import { D2Api } from "types/d2-api";

export class LocalesD2Repository implements LocalesD2Repository {
    constructor(private api: D2Api) {}

    async get(): Async<Locale[]> {
        const d2Locales = await this.api.get<D2Locale[]>("/locales/dbLocales.json").getData();
        return d2Locales;
    }
}

interface D2Locale {
    id: Id;
    name: string;
    locale: string;
}
