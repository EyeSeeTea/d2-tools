import { Async } from "domain/entities/Async";
import { SmsRepository } from "domain/repositories/SmsRepository";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { SmsGateway } from "domain/entities/SmsGateway";

export class CreateSmsGatewayFromConfigUseCase {
    constructor(private smsRepository: SmsRepository) {}

    async execute(configFilePath: string): Async<void> {
        const config = JSON.parse(fs.readFileSync(path.join(".", configFilePath), "utf8"));
        const newGateway = _.omit(config, ["uid"]) as SmsGateway;
        const result = await this.smsRepository.createGateway(newGateway);
        console.info(`${result.status}: ${result.message}`);
    }
}
