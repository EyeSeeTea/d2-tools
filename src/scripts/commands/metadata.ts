import { subcommands } from "cmd-ts";
import { syncMetadata } from "./metadata/sync";

export function getCommand() {
    return subcommands({ name: "metadata", cmds: { sync: syncMetadata } });
}
