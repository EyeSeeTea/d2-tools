import _, { isEmpty } from "lodash";
import log from "utils/log";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";

import { Async } from "domain/entities/Async";
import { MSTeamsWebhookOptions } from "data/user-monitoring/entities/MSTeamsWebhookOptions";
import { MessageRepository } from "domain/repositories/user-monitoring/common/MessageRepository";

export class MessageMSTeamsRepository implements MessageRepository {
    constructor(private webhook: MSTeamsWebhookOptions) {}

    async sendMessage(messageType: string, message: string): Async<boolean> {
        const httpProxy = this.webhook.proxy;
        const url = this.webhook.msUrl;
        const serverName = this.webhook.serverName;

        if (!isEmpty(httpProxy)) {
            process.env["http_proxy"] = httpProxy;
            process.env["https_proxy"] = httpProxy;
        }

        const postData = JSON.stringify({
            text: `[*${messageType}* - ${serverName}] - ${message}`,
        });

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: postData,
            agent: url.startsWith("https")
                ? new HttpsProxyAgent(process.env["https_proxy"] || "")
                : new HttpProxyAgent(process.env["http_proxy"] || ""),
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
