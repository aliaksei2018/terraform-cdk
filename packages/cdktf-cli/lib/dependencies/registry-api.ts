import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ProviderConstraint } from "./dependency-manager";
import * as semver from "semver";

type VersionsReturnType = {
  id: string; // e.g. hashicorp/aws
  versions: {
    version: string; // e.g. "0.12.0"
    protocols: unknown;
    platforms: unknown;
  }[];
};

async function fetchVersions(constraint: ProviderConstraint) {
  const proxy = process.env.http_proxy || process.env.HTTP_PROXY;
  let agent;
  if (proxy) {
    agent = new HttpsProxyAgent(proxy);
  }
  const url = `https://registry.terraform.io/v1/providers/${constraint.namespace}/${constraint.name}/versions`;

  const result = await fetch(url, { agent });
  const json = (await result.json()) as VersionsReturnType;

  return json.versions;
}

/**
 * returns the latest available version for the provider in the constraint
 * the version of the constraint is ignored
 */
export async function getLatestVersion(
  constraint: ProviderConstraint
): Promise<string> {
  const versions = (await fetchVersions(constraint)).map((v) => v.version);

  const latestVersion = versions.reduce((acc, curr) => {
    if (semver.gte(acc, curr)) {
      return acc;
    }
    return curr;
  });

  return latestVersion;
}
