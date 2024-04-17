import { PermissionFixerConfigRepository } from "domain/repositories/user-monitoring/permission-fixer/PermissionFixerConfigRepository";

export class GetPermissionFixerConfigUseCase {
    constructor(private configRepository: PermissionFixerConfigRepository) {}

    async execute() {
        return this.configRepository.get();
    }
}
