import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Async } from "domain/entities/Async";
import { Option } from "domain/entities/Option";
import { OptionRepository } from "domain/repositories/OptionRepository";
import { Maybe } from "utils/ts-utils";
import { D2RenameOptionCode } from "./D2RenameOptionCode";

export class OptionD2Repository implements OptionRepository {
    constructor(private api: D2Api) {}

    async getById(id: string): Async<Option> {
        const option = await this.getMaybeOptionById(id);

        if (!option) {
            throw new Error(`Option with id ${id} not found`);
        } else {
            return option;
        }
    }

    async save(option: Option, options: { dryRun: boolean }): Async<void> {
        const existingOption = await this.getMaybeOptionById(option.id);
        const d2Option = { ...existingOption, ...option };
        const optionCodeChanged = existingOption && existingOption.code !== option.code;

        if (!optionCodeChanged) {
            if (!options.dryRun) {
                const res = await this.api.metadata.post({ options: [d2Option] }).getData();
                console.debug(`Saved option with id ${option.id}: ${JSON.stringify(res.status)}`);
                if (res.status !== "OK") throw new Error(`Failed to save option: ${JSON.stringify(res)}`);
            }
        } else {
            await new D2RenameOptionCode(this.api, { dryRun: options.dryRun }).execute({
                option: existingOption,
                toCode: option.code,
            });
        }
    }

    private async getMaybeOptionById(id: string): Async<Maybe<Option>> {
        const { options } = await this.api.metadata
            .get({
                options: {
                    fields: { $owner: true },
                    filter: { id: { eq: id } },
                },
            })
            .getData();

        return options[0];
    }
}
