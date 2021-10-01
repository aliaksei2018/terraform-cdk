import { spawn, SpawnOptions } from "child_process";
import * as fs from "fs-extra";
import { https, http } from "follow-redirects";
import * as os from "os";
import * as path from "path";
import { processLoggerError, processLoggerDebug } from "./logging";
import { IManifest, Manifest } from "cdktf/lib/manifest";
import { config } from "@cdktf/provider-generator";

export async function shell(
  program: string,
  args: string[] = [],
  options: SpawnOptions = {}
) {
  const stderr = new Array<string | Uint8Array>();
  const stdout = new Array<string>();
  try {
    return await exec(
      program,
      args,
      options,
      (chunk: Buffer) => {
        stdout.push(chunk.toString());
        console.log(chunk.toString());
      },
      (chunk: string | Uint8Array) => stderr.push(chunk)
    );
  } catch (e) {
    if (stderr.length > 0) {
      e.stderr = stderr.map((chunk) => chunk.toString()).join("");
    }
    if (stdout.length > 0) {
      e.stdout = stdout.join("");
    }
    throw e;
  }
}

export async function withTempDir(
  dirname: string,
  closure: () => Promise<void>
) {
  const prevdir = process.cwd();
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), "cdktf."));
  const workdir = path.join(parent, dirname);
  await fs.mkdirp(workdir);
  try {
    process.chdir(workdir);
    await closure();
  } finally {
    process.chdir(prevdir);
    await fs.remove(parent);
  }
}

export async function mkdtemp(closure: (dir: string) => Promise<void>) {
  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "cdktf."));
  try {
    await closure(workdir);
  } finally {
    await fs.remove(workdir);
  }
}

export const exec = async (
  command: string,
  args: string[],
  options: SpawnOptions,
  stdout?: (chunk: Buffer) => any,
  stderr?: (chunk: string | Uint8Array) => any
): Promise<string> => {
  return new Promise((ok, ko) => {
    const child = spawn(command, args, options);
    const out = new Array<Buffer>();
    const err = new Array<string | Uint8Array>();
    if (stdout !== undefined) {
      child.stdout?.on("data", (chunk: Buffer) => {
        processLoggerDebug(chunk);
        stdout(chunk);
      });
    } else {
      child.stdout?.on("data", (chunk: Buffer) => {
        processLoggerDebug(chunk);
        out.push(chunk);
      });
    }
    if (stderr !== undefined) {
      child.stderr?.on("data", (chunk: string | Uint8Array) => {
        processLoggerError(chunk);
        stderr(chunk);
      });
    } else {
      child.stderr?.on("data", (chunk: string | Uint8Array) => {
        processLoggerError(chunk);
        process.stderr.write(chunk);
        err.push(chunk);
      });
    }
    child.once("error", (err: any) => ko(err));
    child.once("close", (code: number) => {
      if (code !== 0) {
        const error = new Error(`non-zero exit code ${code}`);
        (error as any).stderr = err.map((chunk) => chunk.toString()).join("");
        return ko(error);
      }
      return ok(Buffer.concat(out).toString("utf-8"));
    });
  });
};

export async function readCDKTFVersion(outputDir: string): Promise<string> {
  const outputFile = path.join(outputDir, "cdk.tf.json");
  if (fs.existsSync(outputFile)) {
    const outputJSON = fs.readFileSync(outputFile, "utf8");
    const data = JSON.parse(outputJSON);
    return data["//"].metadata.version;
  }

  return "";
}

export async function readCDKTFManifest(): Promise<IManifest> {
  const { output } = config.readConfigSync();
  const json = await fs.readFile(path.join(output, Manifest.fileName));
  return JSON.parse(json.toString()) as IManifest;
}

/**
 * Downcase the first character in a string.
 *
 * @param str the string to be processed.
 */
export function downcaseFirst(str: string): string {
  if (str === "") {
    return str;
  }
  return `${str[0].toLocaleLowerCase()}${str.slice(1)}`;
}

export class HttpError extends Error {
  constructor(message?: string, public statusCode?: number) {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    // see: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
  }
}

export async function downloadFile(
  url: string,
  targetFilename: string
): Promise<void> {
  const client = url.startsWith("http://") ? http : https;
  const file = fs.createWriteStream(targetFilename);
  return new Promise((ok, ko) => {
    const request = client.get(url, (response) => {
      if (response.statusCode !== 200) {
        ko(
          new HttpError(
            `Failed to get '${url}' (${response.statusCode})`,
            response.statusCode
          )
        );
        return;
      }
      response.pipe(file);
    });

    file.on("finish", () => ok());

    request.on("error", (err) => {
      fs.unlink(targetFilename, () => ko(err));
    });

    file.on("error", (err) => {
      fs.unlink(targetFilename, () => ko(err));
    });

    request.end();
  });
}
