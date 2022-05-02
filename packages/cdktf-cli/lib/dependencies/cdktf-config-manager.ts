import { CdktfConfig } from "../cdktf-config";
import { ProviderConstraint } from "./dependency-manager";

/**
 * facilitates adding provider dependencies to cdktf.json
 */
export class CdktfConfigManager {
  private config: CdktfConfig = CdktfConfig.read();

  public async hasProvider(constraint: ProviderConstraint): Promise<boolean> {
    // TODO: implement

    return false;
  }

  public async addProvider(constraint: ProviderConstraint): Promise<void> {
    const currentProviders = this.config.terraformProviders;

    const simplifiedSource = constraint.source.replace(
      "registry.terraform.io/",
      ""
    );

    const provider =
      simplifiedSource + (constraint.version ? `@${constraint.version}` : "");

    // TODO: check if provider exists already, if yes replace it

    currentProviders.push(provider);
    this.config.writeTerraformProviders(currentProviders);
  }
}
