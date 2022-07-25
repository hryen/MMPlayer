import { Track } from "@/models/track";

export function walkDirectory(dirPath: string): Promise<Track[]> {
  const path = require("path");
  const { exec } = require("child_process");
  const start = new Date().getTime();
  const command =
    '"' +
    path.resolve(process.cwd(), "tools", "musicTool.exe") +
    '" walk "' +
    dirPath +
    '"';
  return new Promise<Track[]>((resolve) => {
    exec(command, (_error: any, stdout: any, _stderr: any) => {
      try {
        console.log(
          dirPath,
          "WalkDirectory完成, 用时",
          new Date().getTime() - start,
          "ms"
        );
        resolve(JSON.parse(stdout));
      } catch (err) {
        console.log("walkDirectory 出错了", err); // TODO: 提示用户
        console.log("stdout", stdout);
        resolve([]);
      }
    });
  });
}

export function getPeakData(playListId: number, trackId: number): string {
  const path = require("path");
  const fs = require("fs");
  const peekFile = path.resolve(
    process.cwd(),
    "cache",
    "peak_data",
    playListId+"",
    trackId + ".json"
  );
  return JSON.parse(fs.readFileSync(peekFile));
}
