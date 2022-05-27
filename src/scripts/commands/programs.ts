import _ from "lodash";
import { command, string, option, restPositionals, optional, subcommands, Type } from "cmd-ts";
import { getApiUrlOption, getD2Api, log } from "scripts/common";

export function getCommand() {
    const exportCmd = command({
        name: "export",
        description: "Export program metadata and data (events, enrollments, TEIs)",
        args: {
            url: getApiUrlOption(),
        },
        handler: async args => {
            const api = getD2Api(args.url);

            /*
            const dataSetsRepository1 = new DataSetsD2Repository(api1);
            const dataSetsRepository2 = new DataSetsD2Repository(api2);
            const showDiff = new ShowDataSetsDiffUseCase(dataSetsRepository1, dataSetsRepository2);
            */

            const { programs } = await api.metadata
                .get({
                    programs: {
                        fields: { id: true },
                    },
                })
                .getData();

            log.debug(programs);
        },
    });

    return subcommands({
        name: "programs",
        cmds: { export: exportCmd },
    });
}
