import { TwoFactorConfigRepository } from "domain/repositories/user-monitoring/two-factor-monitoring/TwoFactorConfigRepository";

export class GetTwoFactorConfigUseCase {
    constructor(private configRepository: TwoFactorConfigRepository) {}

    async execute() {
        return this.configRepository.get();
    }
}
