import config from "@/config";

export async function walkDirectory(dirPath: string) {
  const util = require("node:util");
  const execFile = util.promisify(require("node:child_process").execFile);
  const { stdout, stderr } = await execFile(config.MusicToolsFile, [
    "walk",
    dirPath,
  ]);
  if (stderr) {
    console.error(stderr);
  } else {
    console.log(stdout);
  }
}

export function getPeakData(trackId: string): string {
  const path = require("path");
  const fs = require("fs");
  const peekFile = path.resolve(
    process.cwd(),
    "cache",
    "peak_data",
    trackId + ".json"
  );
  return JSON.parse(fs.readFileSync(peekFile));
}
