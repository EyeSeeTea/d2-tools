import { Async } from "domain/entities/Async";
import { SmsRepository } from "domain/repositories/SmsRepository";

export class SendSmsUseCase {
    constructor(private smsRepository: SmsRepository) {}

    async execute(options: SendSmsUseCaseOptions): Async<void> {
        const result = await this.smsRepository.sendSMS(options);
        console.info(`${result.status}: ${result.message}`);
    }
}

export interface SendSmsUseCaseOptions {
    recipient: string;
    message: string;
}
