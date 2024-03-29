import { config } from "@/config";

export async function walkDirectory(dirPath: string): Promise<string> {
  const util = require("node:util");
  const execFile = util.promisify(require("node:child_process").execFile);
  const { stdout, stderr } = await execFile(config.MusicToolsFile, [
    "walk",
    dirPath,
  ], { cwd: config.UserDataPath });
  if (stderr) {
    return Promise.reject(stderr);
  } else {
    return Promise.resolve(stdout);
  }
}

export async function reWalkDirectory(id: string): Promise<string> {
  const util = require("node:util");
  const execFile = util.promisify(require("node:child_process").execFile);
  const { stdout, stderr } = await execFile(config.MusicToolsFile, [
    "rewalk",
    id,
  ], { cwd: config.UserDataPath });
  if (stderr) {
    return Promise.reject(stderr);
  } else {
    return Promise.resolve(stdout);
  }
}

export function getPeakData(trackId: string): string {
  const path = require("path");
  const fs = require("fs");
  const peekFile = path.resolve(
    config.UserDataPath,
    "peak_data",
    trackId + ".json"
  );
  return JSON.parse(fs.readFileSync(peekFile));
}

export async function exportImage(
  filePath: string,
  exportPath: string
): Promise<string> {
  const path = require("path");
  const fs = require("fs");
  const imageCacheDir = path.resolve(config.UserDataPath, "export_image");
  if (!fs.existsSync(imageCacheDir)) {
    fs.mkdirSync(imageCacheDir, { recursive: true });
  }

  const util = require("node:util");
  const execFile = util.promisify(require("node:child_process").execFile);
  const { stdout, stderr } = await execFile(config.MusicToolsFile, [
    "--export-image",
    filePath,
    exportPath,
  ]);

  if (stderr) {
    return Promise.reject(stderr);
  } else {
    return Promise.resolve(stdout);
  }
}
