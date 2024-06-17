import _, { isEmpty } from "lodash";
import log from "utils/log";
import { Async } from "domain/entities/Async";
import { MSTeamsWebhookOptions } from "data/user-monitoring/entities/MSTeamsWebhookOptions";
import { MessageRepository } from "domain/repositories/user-monitoring/authorities-monitoring/MessageRepository";

export class MessageMSTeamsRepository implements MessageRepository {
    constructor(private webhook: MSTeamsWebhookOptions) {}

    async sendMessage(message: string): Async<boolean> {
        const httpProxy = this.webhook.proxy;
        const url = this.webhook.ms_url;
        const server_name = this.webhook.server_name;

        if (!isEmpty(httpProxy)) {
            process.env["http_proxy"] = httpProxy;
            process.env["https_proxy"] = httpProxy;
        }

        const postData = JSON.stringify({
            text: `[*AUTHORITIES-MONITORING* - ${server_name}] - ${message}`,
        });

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: postData,
        };

        try {
            const response = await fetch(url, requestOptions);
            return response.ok;
        } catch (error) {
            log.error(`Error sending message: ${error}`);
            return false;
        }
    }
}
