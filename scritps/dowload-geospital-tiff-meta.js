/**
 * https://registry.opendata.aws/copernicus-dem/
 *
 * Downloads GeoTIFF files from the Copernicus DEM dataset on AWS S3
 *
 * Usage: node dowload-geospital-tiff.js <output-directory>
 */

import { spawnSync, spawn } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import os from "os";
import path from "path";

const osPlatform = os.platform();

function getNewLine() {
  return osPlatform === "win32" ? "\r\n" : "\n";
}

function spawnSyncWrapper(command, args, options = undefined) {
  const result = spawnSync(
    command,
    args,
    options || {
      stdio: ["ignore", "pipe", "ignore"],
      shell: true,
      encoding: "utf-8",
    },
  );

  return result;
}

async function spawnWrapper(command, args, options = undefined) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options || { shell: true });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

console.log("Fetching GeoTIFF folders from aws S3");

const result = await spawnWrapper(
  "aws",
  ["s3", "ls", "--no-sign-request", "s3://copernicus-dem-30m/"],
  undefined,
);

const tiffFolders = result.stdout
  .split(getNewLine())
  .map((line) => line.trim())
  .filter((line) => /^\s*PRE.*$/.test(line))
  .map((line) => line.replace(/^\s*PRE\s*/, "").trim())
  .map((line) => line.replace(/\/$/, ""));

const outFile = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : (() => {
      throw new Error("Output directory not specified");
    })();

console.log("Preparing to download GeoTIFF files URI to:", outFile);

const data = [];
for (const rootFolder of tiffFolders) {
  const [_, latitudeDirection, latitudeValue] = /(N|S)(\d+)_/.exec(rootFolder);
  const [__, longitudeDirection, longitudeValue] = /(E|W)(\d+)/.exec(
    rootFolder,
  );

  data.push({
    tiffFileUri: `s3://copernicus-dem-30m/${rootFolder}/${rootFolder}.tif`,
    rootFolderUri: `s3://copernicus-dem-30m/${rootFolder}`,
    latitudeDirection,
    latitudeValue,
    longitudeDirection,
    longitudeValue,
  });
}

mkdirSync(path.dirname(outFile), { recursive: true });

writeFileSync(outFile, JSON.stringify(data, null, 2), {
  flag: "w",
});
