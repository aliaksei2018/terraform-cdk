import { Language } from "@cdktf/provider-generator";
import { existsSync } from "fs-extra";
import path from "path";
import { exec } from "../util";

/**
 * manages installing, updating, and removing dependencies
 * in the package system used by the target language of a CDKTF
 * project
 */
export abstract class PackageManager {
  constructor(protected readonly workingDirectory: string) {}

  public static forLanguage(
    language: Language,
    workingDirectory: string
  ): PackageManager {
    switch (language) {
      case Language.GO:
        throw new Error("Go is not supported yet");
      case Language.TYPESCRIPT:
        return new NodePackageManager(workingDirectory);
      case Language.PYTHON:
        return new PythonPackageManager(workingDirectory);
      case Language.CSHARP:
        return new NugetPackageManager(workingDirectory);
      case Language.JAVA:
        return new MavenPackageManager(workingDirectory);
      default:
        throw new Error(`Unknown language: ${language}`);
    }
  }

  public abstract addPackage(
    packageName: string,
    packageVersion?: string
  ): Promise<void>;
  // public abstract listPackages(): Promise<todo>; future stuff..
  // add check if package exists already. might query version in the future and offer to upgrade?
}

class NodePackageManager extends PackageManager {
  private hasYarnLockfile(): boolean {
    return existsSync(path.join(this.workingDirectory, "yarn.lock"));
  }

  public async addPackage(
    packageName: string,
    packageVersion?: string
  ): Promise<void> {
    console.log(`Adding package ${packageName} @ ${packageVersion}`);

    // probe for package-lock.json or yarn.lock
    let command = "npm";
    let args = ["install"];

    if (this.hasYarnLockfile()) {
      command = "yarn";
      args = ["add"];
    }
    args.push(
      packageVersion ? packageName + "@" + packageVersion : packageName
    );

    await exec(command, args, { cwd: this.workingDirectory });
  }
}

class PythonPackageManager extends PackageManager {
  public addPackage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class NugetPackageManager extends PackageManager {
  public addPackage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class MavenPackageManager extends PackageManager {
  public addPackage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
