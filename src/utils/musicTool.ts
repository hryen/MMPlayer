import { Track } from "@/models/track";
import { useMainStore } from "@/stores/main";
import { storeToRefs } from "pinia";

export function walkDirectory(dirPath: string): Promise<Track[]> {
  const mainStore = useMainStore();
  const { isLoading } = storeToRefs(mainStore);
  isLoading.value = true;

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
        isLoading.value = false;
      } catch (err) {
        console.log("walkDirectory 出错了", err); // TODO: 提示用户
        console.log("stdout", stdout);
        resolve([]);
        isLoading.value = false;
      }
    });
  });
}
