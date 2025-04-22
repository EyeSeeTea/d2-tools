import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { Option } from "domain/entities/Option";
import { OptionRepository } from "domain/repositories/OptionRepository";

type Options = {
    optionId: Id;
    toCode: string;
    post: boolean;
};

export class RenameOptionCodeUseCase {
    constructor(private readonly optionRepository: OptionRepository) {}

    async execute(options: Options): Async<void> {
        const option = await this.optionRepository.getById(options.optionId);

        if (option.code === options.toCode) {
            console.debug(`Option code is already '${options.toCode}'`);
        } else {
            console.debug(`Renaming option code from ${option.code} to ${options.toCode}`);
            const optionUpdated: Option = { ...option, code: options.toCode };
            await this.optionRepository.save(optionUpdated, { dryRun: !options.post });
        }
    }
}
