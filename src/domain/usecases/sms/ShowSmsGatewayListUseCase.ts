import { Async } from "domain/entities/Async";
import { SmsRepository } from "domain/repositories/SmsRepository";

export class ShowSmsGatewayListUseCase {
    constructor(private smsRepository: SmsRepository) {}

    async execute(): Async<void> {
        const gateways = await this.smsRepository.getGateways();
        if (gateways.length === 0) {
            console.info("No gateways found");
            return;
        }
        console.table(gateways, ["uid", "isDefault", "type", "name", "urlTemplate"]);
    }
}
