import _, { isEmpty } from "lodash";
import log from "utils/log";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import axios from "axios";

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

        const text = `[*${messageType}* - ${serverName}] - ${message}`;
        const data = { text };

        const agent = url.startsWith("https")
            ? new HttpsProxyAgent(process.env["https_proxy"] || "")
            : new HttpProxyAgent(process.env["http_proxy"] || "");

        try {
            const response = await axios.post(url, data, {
                headers: {
                    "Content-Type": "application/json",
                },
                httpAgent: agent,
                httpsAgent: agent,
                timeout: 10000,
                proxy: false,
            });

            return response.status >= 200 && response.status < 300;
        } catch (error) {
            log.error(`Error sending message: ${error}`);
            return false;
        }
    }
}
