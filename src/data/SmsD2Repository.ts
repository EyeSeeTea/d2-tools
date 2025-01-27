import { D2Api } from "types/d2-api";
import { Async } from "domain/entities/Async";
import { SmsGateway } from "domain/entities/SmsGateway";
import { SendSmsOptions, SmsOperationResponse, SmsRepository } from "domain/repositories/SmsRepository";
import { Id } from "domain/entities/Base";
import { SmsOutbound } from "domain/entities/SmsOutbound";
import { Pager } from "domain/entities/Pager";

export interface D2SmsGatewayParameter {
    header: boolean;
    encode: boolean;
    key: string;
    value: string;
    confidential: boolean;
}

export class SmsD2Repository implements SmsRepository {
    constructor(private api: D2Api) {}

    async getGateways(): Async<SmsGateway[]> {
        const { gateways } = await this.api.get<{ gateways: SmsGateway[] }>("gateways").getData();
        return gateways;
    }

    async getGatewayById(uid: Id): Async<SmsGateway> {
        const gateway = await this.api.get<SmsGateway>(`gateways/${uid}`).getData();
        return gateway;
    }

    async createGateway(gatewayInfo: SmsGateway): Async<SmsOperationResponse> {
        const response = await this.api.post<SmsOperationResponse>("gateways", {}, gatewayInfo).getData();
        return response;
    }

    async updateGateway(uid: Id, gatewayInfo: SmsGateway): Async<SmsOperationResponse> {
        const response = await this.api
            .put<SmsOperationResponse>(`gateways/${uid}`, {}, gatewayInfo)
            .getData();

        return response;
    }

    async deleteGateway(uid: Id): Async<SmsOperationResponse> {
        const response = await this.api.delete<SmsOperationResponse>(`gateways/${uid}`).getData();

        return response;
    }

    async sendSMS(payload: SendSmsOptions): Async<SmsOperationResponse> {
        const response = await this.api
            .post<SmsOperationResponse>(
                "sms/outbound",
                {},
                {
                    message: payload.message,
                    recipients: [payload.recipient],
                }
            )
            .getData();
        return response;
    }

    async getOutboundSmsList(): Async<SmsOutbound[]> {
        const response = await this.api
            .get<{ pager: Pager; outboundsmss: SmsOutbound[] }>("sms/outbound", {
                fields: "*",
                order: "date:desc",
            })
            .getData();
        return response.outboundsmss;
    }
}
