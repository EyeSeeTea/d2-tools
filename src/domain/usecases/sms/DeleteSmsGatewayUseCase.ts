import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { SmsRepository } from "domain/repositories/SmsRepository";
import _ from "lodash";

export class DeleteSmsGatewayUseCase {
    constructor(private smsRepository: SmsRepository) {}

    async execute(id: Id): Async<void> {
        const result = await this.smsRepository.deleteGateway(id);
        console.info(`${result.status}: ${result.message}`);
    }
}
