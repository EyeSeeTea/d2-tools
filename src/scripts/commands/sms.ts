import _ from "lodash";
import { command, string, option, subcommands } from "cmd-ts";
import { getApiUrlOption, getD2Api } from "scripts/common";
import { SmsD2Repository } from "data/SmsD2Repository";
import { ShowSmsGatewayListUseCase } from "domain/usecases/sms/ShowSmsGatewayListUseCase";
import { ShowSmsGatewayInfoUseCase } from "domain/usecases/sms/ShowSmsGatewayInfoUseCase";
import { CreateSmsGatewayFromConfigUseCase } from "domain/usecases/sms/CreateSmsGatewayFromConfigUseCase";
import { SendSmsUseCase } from "domain/usecases/sms/SendSmsUseCase";
import { DeleteSmsGatewayUseCase } from "domain/usecases/sms/DeleteSmsGatewayUseCase";
import { ShowSmsOutboundListUseCase } from "domain/usecases/sms/ShowSmsOutboundListUseCase";

export function getCommand() {
    const listGatewaysCmd = command({
        name: "list",
        description: "Return the list of SMS gateways",
        args: {
            url: getApiUrlOption({ long: "url" }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const smsRepository = new SmsD2Repository(api);
            new ShowSmsGatewayListUseCase(smsRepository).execute();
        },
    });

    const infoGatewayCmd = command({
        name: "info",
        description: "Return the complete information for a SMS gateway",
        args: {
            url: getApiUrlOption({ long: "url" }),
            uid: option({
                type: string,
                long: "uid",
                description: "uid of the gateway",
            }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const smsRepository = new SmsD2Repository(api);
            new ShowSmsGatewayInfoUseCase(smsRepository).execute(args.uid);
        },
    });

    const createGatewayCmd = command({
        name: "create",
        description: "Create a new SMS gateway from a config file",
        args: {
            url: getApiUrlOption({ long: "url" }),
            configFile: option({
                type: string,
                long: "config-file",
                description: "Config file",
            }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const smsRepository = new SmsD2Repository(api);
            new CreateSmsGatewayFromConfigUseCase(smsRepository).execute(args.configFile);
        },
    });

    const deleteGatewayCmd = command({
        name: "delete",
        description: "Delete a SMS gateway",
        args: {
            url: getApiUrlOption({ long: "url" }),
            uid: option({
                type: string,
                long: "uid",
                description: "uid of the gateway",
            }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const smsRepository = new SmsD2Repository(api);
            new DeleteSmsGatewayUseCase(smsRepository).execute(args.uid);
        },
    });

    const sendSmsCmd = command({
        name: "send",
        description: "Send SMS",
        args: {
            url: getApiUrlOption({ long: "url" }),
            message: option({
                short: "m",
                type: string,
                long: "message",
                description: "Contents of the SMS",
            }),
            to: option({
                type: string,
                long: "to",
                description: "Recipient of the SMS",
            }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const smsRepository = new SmsD2Repository(api);
            new SendSmsUseCase(smsRepository).execute({
                message: args.message,
                recipient: args.to,
            });
        },
    });

    const outboundCmd = command({
        name: "outbound",
        description: "List latest outbound SMSs",
        args: {
            url: getApiUrlOption({ long: "url" }),
        },
        handler: async args => {
            const api = getD2Api(args.url);
            const smsRepository = new SmsD2Repository(api);
            new ShowSmsOutboundListUseCase(smsRepository).execute();
        },
    });

    const gatewaysSubCommands = subcommands({
        name: "gateways",
        cmds: {
            list: listGatewaysCmd,
            info: infoGatewayCmd,
            create: createGatewayCmd,
            delete: deleteGatewayCmd,
        },
    });

    return subcommands({
        name: "sms",
        cmds: { gateways: gatewaysSubCommands, send: sendSmsCmd, outbound: outboundCmd },
    });
}
