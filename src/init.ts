import { usePlaylistStore } from "@/stores/playlist";
import { usePlayerStore } from "@/stores/player";
import { initConfig } from "@/config";
// import { walkDirectory } from "@/utils/musicTool";

const { ipcRenderer } = require("electron");
ipcRenderer.on("rendered", async (_event: any, userDataPath: string) => {
  // console.log(userDataPath);
  initConfig(userDataPath);
  // const start = new Date().getTime();
  await usePlaylistStore().init();
  usePlayerStore().init();
  // console.log("初始化完成, 用时", new Date().getTime() - start, "ms");
  // await walkDirectory("C:/Users/henry/Music/麦小兜");
});
