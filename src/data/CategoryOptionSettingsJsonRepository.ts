import { Codec } from "purify-ts";
import { string, array, optional, record, oneOf, exactly } from "purify-ts/Codec";
import { Async } from "domain/entities/Async";
import { Path } from "domain/entities/Base";
import { CategoryOptionSettings } from "domain/entities/CategoryOptionSettings";
import { CategoryOptionSettingsRepository } from "domain/repositories/CategoryOptionSettingsRepository";
import { readFile } from "jsonfile";

const PublicPermissionSettingCodec = Codec.interface({
    value: string,
});

const GroupPermissionSettingCodec = Codec.interface({
    filter: string,
    value: string,
});

const PermissionImportModeCodec = oneOf([exactly("append"), exactly("overwrite")]);

const PermissionSettingCodec = Codec.interface({
    permissionImportMode: PermissionImportModeCodec,
    public: optional(PublicPermissionSettingCodec),
    groups: optional(array(GroupPermissionSettingCodec)),
});

const CategoryOptionSettingsCodec = record(string, PermissionSettingCodec);
export class CategoryOptionSettingsJsonRepository implements CategoryOptionSettingsRepository {
    async get(path: Path): Async<CategoryOptionSettings> {
        const settings = await readFile(path);
        return new Promise(resolve => {
            return CategoryOptionSettingsCodec.decode(settings).caseOf({
                Left: err => {
                    throw Error(err);
                },
                Right: res => {
                    return resolve(res);
                },
            });
        });
    }
}
