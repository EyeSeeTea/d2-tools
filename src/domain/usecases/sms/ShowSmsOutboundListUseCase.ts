import { Async } from "domain/entities/Async";
import { SmsRepository } from "domain/repositories/SmsRepository";

export class ShowSmsOutboundListUseCase {
    constructor(private smsRepository: SmsRepository) {}

    async execute(): Async<void> {
        const outboundMessages = await this.smsRepository.getOutboundSmsList();
        console.table(
            outboundMessages.map(m => ({
                ...m,
                recipients: m.recipients.join(", "),
            })),
            ["date", "status", "recipients", "message"]
        );
    }
}
