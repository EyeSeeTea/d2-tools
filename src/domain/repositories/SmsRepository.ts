import { Async } from "domain/entities/Async";
import { Id } from "domain/entities/Base";
import { SmsGateway } from "domain/entities/SmsGateway";
import { SmsOutbound } from "domain/entities/SmsOutbound";

export interface SendSmsOptions {
    message: string;
    recipient: string;
}

export interface SmsOperationResponse {
    status: "OK" | "ERROR";
    message: string;
}

export interface SmsRepository {
    getGateways(): Async<SmsGateway[]>;
    getGatewayById(uid: Id): Async<SmsGateway>;
    createGateway(gatewayInfo: SmsGateway): Async<SmsOperationResponse>;
    updateGateway(uid: Id, gatewayInfo: SmsGateway): Async<SmsOperationResponse>;
    deleteGateway(uid: Id): Async<SmsOperationResponse>;

    sendSMS(payload: SendSmsOptions): Async<SmsOperationResponse>;
    getOutboundSmsList(): Async<SmsOutbound[]>;
}
