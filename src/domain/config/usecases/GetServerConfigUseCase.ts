import { ConfigRepository } from "../repositories/ConfigRepository";

export class GetServerConfigUseCase {
    constructor(private configRepository: ConfigRepository) {}

    async execute() {
        return this.configRepository.getConfig();
    }
}
