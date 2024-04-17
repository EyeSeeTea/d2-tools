import _, { isEmpty } from "lodash";
import log from "utils/log";
import { Async } from "domain/entities/Async";
import { WebhookOptions } from "domain/entities/user-monitoring/UserMonitoring";
import { MessageRepository } from "domain/repositories/user-monitoring/MessageRepository";

export class MessageMSTeamsRepository implements MessageRepository {
    constructor(private webhook: WebhookOptions) {}

    async sendMessage(message: string): Async<void> {
        const httpProxy = this.webhook.proxy;
        const url = this.webhook.ms_url;
        const server_name = this.webhook.server_name;

        if (!isEmpty(httpProxy)) {
            process.env["http_proxy"] = httpProxy;
            process.env["https_proxy"] = httpProxy;
        }

        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

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
            await fetch(url, requestOptions);
            log.info(`Message sent to MSTeams`);
        } catch (error) {
            log.error(`Error sending message: ${error}`);
        }
    }
}
