import { Language } from "@cdktf/provider-generator";
import { Errors } from "../errors";
import { PackageManager } from "./package-manager";

// ref: https://www.terraform.io/language/providers/requirements#source-addresses
const DEFAULT_HOSTNAME = "registry.terraform.io";
const DEFAULT_NAMESPACE = "hashicorp";
function normalizeProviderSource(source: string) {
  // returns <HOSTNAME>/<NAMESPACE>/<TYPE>
  const slashes = source.split("/").length - 1;
  switch (slashes) {
    case 0:
      return `${DEFAULT_HOSTNAME}/${DEFAULT_NAMESPACE}/${source}`;
    case 1:
      return `${DEFAULT_HOSTNAME}/${source}`;
    default:
      return source;
  }
}

class ProviderConstraint {
  public readonly source: string;

  // TODO: parse the version constraint, add examples to cli command description (i.e. =,~>.> etc.)
  // if no version constraint is specified, we assume the latest version
  // if specific version is specified without e.g. =, we allow patch level increments (e.g. ~>2.12 for "2.12")
  constructor(source: string, public readonly version: string | undefined) {
    this.source = normalizeProviderSource(source);
  }
}

export class DependencyManager {
  private packageManager: PackageManager;

  constructor(
    private readonly targetLanguage: Language,
    private cdktfVersion: string
  ) {
    this.packageManager = PackageManager.forLanguage(targetLanguage);
  }

  async addProvider(constraint: ProviderConstraint) {
    if (await this.hasPrebuiltProvider(constraint)) {
      return this.addPrebuiltProvider(constraint);
    } else {
      return this.addLocalProvider(constraint);
    }
  }

  async hasPrebuiltProvider(constraint: ProviderConstraint): Promise<boolean> {
    // TODO: query NPM for this, add layer that queries this and also caches calls a bit, so we don't have to query NPM every time
    constraint;
    // Go has no pre-built providers at the moment
    if (this.targetLanguage === Language.GO) {
      return false;
    }

    return Promise.resolve(false);
  }

  async addPrebuiltProvider(constraint: ProviderConstraint) {
    constraint;
    if (this.targetLanguage === Language.GO) {
      throw Errors.Usage(
        "There are no pre-built providers published for Go at the moment. See https://github.com/hashicorp/terraform-cdk/issues/723"
      );
    }

    const packageName = this.convertPackageName(constraint.source);
    // TODO: determine version of pre-built provider package that matches provider version constraint
    // uses:
    this.cdktfVersion;

    this.packageManager.addPackage(); // TODO: convert name of package to target language
    packageName;

    // TODO: add prebuilt provider, throw error if it does not exist
    // installs package based on target language
  }

  async addLocalProvider(constraint: ProviderConstraint) {
    constraint;
    // TODO: add local provider, determine latest version if no version is set (set to e.g. ~> 2.0), (run get afterwards?)
    // add to cdktf.json file
  }

  /**
   * Converts an NPM package name of a pre-built provider package to the name in the target language
   */
  private convertPackageName(name: string): string {
    switch (this.targetLanguage) {
      case Language.GO:
        throw new Error("pre-built providers are not supported for Go yet");
      case Language.TYPESCRIPT:
        return name; // already the correct name
      default:
        throw new Error(
          `converting package name for language ${this.targetLanguage} not implemented yet`
        );
    }
  }
}
