import { useMainStore } from "@/stores/main";
import { usePlayerStore } from "@/stores/player";
import { storeToRefs } from "pinia";

const { ipcRenderer } = require("electron");
ipcRenderer.on("rendered", (event: any, arg: any) => {
  // init playlist
  const mainStore = useMainStore();
  const playerStore = usePlayerStore();
  const path = require("path");
  const playListsFile = path.resolve(process.cwd(), "playLists.json");
  try {
    const fs = require("fs");
    const { playLists } = storeToRefs(mainStore);
    const start = new Date().getTime();
    playLists.value = JSON.parse(fs.readFileSync(playListsFile));
    console.log("读取播放列表完成, 用时", new Date().getTime() - start, "ms");
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.log(playListsFile + " not found");
    } else {
      console.error("读取已保存的播放列表时出错", err);
    }
  }

  // init wavesurfer
  playerStore.init();
});
