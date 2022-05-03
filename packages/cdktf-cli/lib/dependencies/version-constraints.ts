import * as semver from "semver";
import { Errors } from "../errors";

type Operator = "=" | "!=" | "~>" | ">=" | "<=" | ">" | "<";

// constraints can be prefixed with "~>", ">", "<", "=", ">=", "<=" or "!="
// no prefix means "="
export function parseConstraint(constraint: string): {
  operator: Operator;
  version: string;
} {
  const cleaned = constraint.trim();

  const operator = (cleaned.match(/(~>|>=|<=|>|<|=|!=)/)?.[0] ||
    "=") as Operator;
  const version = cleaned.replace(operator, "").trim();

  return {
    operator,
    version,
  };
}

export function versionMatchesConstraint(
  version: string,
  constraint: string
): boolean {
  // https://www.terraform.io/language/expressions/version-constraints
  // version can contain multiple constraints split by ","

  const constraints = constraint.split(",");

  // each constraint needs to be satisfied
  return constraints.every((c) => {
    const parsed = parseConstraint(c);

    switch (parsed.operator) {
      case "=":
        return version === parsed.version;
      case "!=":
        return version !== parsed.version;
      case "~>": // allows rightmost version component to increment
        return semver.satisfies(version, `~${parsed.version}`);
      case ">=":
        return semver.gte(version, parsed.version);
      case "<=":
        return semver.lte(version, parsed.version);
      case ">":
        return semver.gt(version, parsed.version);
      case "<":
        return semver.lt(version, parsed.version);
      default:
        throw Errors.External(
          `Unknown constraint operator: ${parsed.operator} in version constraint ${constraint}`
        );
    }
  });
}
