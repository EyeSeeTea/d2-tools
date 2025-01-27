import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { SmsRepository } from "domain/repositories/SmsRepository";

export class ShowSmsGatewayInfoUseCase {
    constructor(private smsRepository: SmsRepository) {}

    async execute(id: Id): Async<void> {
        const gateway = await this.smsRepository.getGatewayById(id);
        console.info(JSON.stringify(gateway, null, 4));
    }
}
