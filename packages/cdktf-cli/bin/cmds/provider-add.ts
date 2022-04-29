import yargs from "yargs";
import { requireHandlers } from "./helper/utilities";
import { Errors } from "../../lib/errors";
import { BaseCommand } from "./helper/base-command";

class Command extends BaseCommand {
  public readonly command = "add <provider> [version-constraint]";
  public readonly describe = "Add a Terraform provider to your project.";

  public readonly builder = (args: yargs.Argv) =>
    args
      .showHelpOnFail(true)
      .positional("provider", {
        type: "string",
        desc: "Name of the provider to add",
        required: true,
      })
      .positional("version-constraint", {
        type: "string",
        desc: "optional version constraint",
      });

  public async handleCommand(argv: any) {
    Errors.setScope("provider add");
    // deferred require to keep cdktf-cli main entrypoint small (e.g. for fast shell completions)
    const api = requireHandlers();
    await api.providerAdd(argv);
  }
}

module.exports = new Command();
