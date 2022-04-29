import yargs from "yargs";

class Command implements yargs.CommandModule {
  public readonly command = "provider";
  public readonly describe = "Provider subcommands"; // TODO: reword

  public readonly builder = (args: yargs.Argv) =>
    args.command(require("./get")).command(require("./provider-add"));

  public readonly handler = () => {
    yargs.showHelp();
  };
}

module.exports = new Command();
