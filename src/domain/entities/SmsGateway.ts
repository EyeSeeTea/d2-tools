import { D2SmsGatewayParameter } from "data/SmsD2Repository";
import { Id } from "./Base";

export type SmsGateway = ClickatellGateway | BulkSmsGateway | SMPPGateway | GenericHttpSmsGateway;

interface SmsGatewayBase {
    uid?: Id;
    name: string;
    isDefault: boolean;
}

export interface ClickatellGateway extends SmsGatewayBase {
    type: "clickatell";
    username: string;
    authToken: string;
    urlTemplate: string;
}

export interface BulkSmsGateway extends SmsGatewayBase {
    type: "bulksms";
    username: string;
    password: string;
}

export interface SMPPGateway extends SmsGatewayBase {
    type: "smpp";
    systemId: string;
    host: string;
    systemType: string;
    numberPlanIndicator: string;
    typeOfNumber: string;
    bindType: string;
    port: number;
    password: string;
    compressed: boolean;
}

export interface GenericHttpSmsGateway extends SmsGatewayBase {
    type: "http";
    configurationTemplate: string;
    useGet: boolean;
    sendUrlParameters: boolean;
    urlTemplate: string;
    contentType: string;
    parameters: Array<D2SmsGatewayParameter>;
}
