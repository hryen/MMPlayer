<script setup lang="ts">
import { onMounted } from "vue";
import { useMainStore } from "@/stores/main";
import { usePlayerStore } from "@/stores/player";
import { storeToRefs } from "pinia";
import { walkDirectory } from "@/utils/musicTool";

const mainStore = useMainStore();
const playerStore = usePlayerStore();

const { playLists, showingPlayListIndex, isLoading } = storeToRefs(mainStore);
const { playingPlayListIndex, playingTrackIndex } = storeToRefs(playerStore);

const path = require("path");
const fs = require("fs");
const { ipcRenderer, shell } = require("electron");

const playListsFile = path.resolve(process.cwd(), "playLists.json");
onMounted(() => {
  // 读取已保存的播放列表
  try {
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
});

// 刷新所有歌单的歌曲
function refreshPlayList() {
  playLists.value.forEach(async (playList) => {
    const tracks = await walkDirectory(playList.path);
    playList.tracks = tracks;
  });

  // 保存歌单列表
  writePlayListToFile(playListsFile);

  // 删除缓存
  fs.rm(
    path.resolve(process.cwd(), "cache", "peak_data"),
    { recursive: true },
    (err: any) => {
      if (err) {
        console.error("删除 peak data 缓存时出错", err);
      }
    }
  );

  // TODO: 提示刷新完成
  console.log("刷新歌单完成");
}

// 添加歌单
function addPlayList() {
  ipcRenderer.send("dialogOpenDirectory", false);
}
ipcRenderer.on("dialogOpenDirectory-reply", async (event: any, arg: any) => {
  // console.log("addPlayList", arg);
  if (!arg.canceled) {
    const playList = {
      id: playLists.value.length + 1,
      path: arg.filePaths[0].replaceAll("\\", "/"),
      tracks: [] as any,
    };
    playLists.value.push(playList);
    // 扫描歌曲
    playLists.value[playLists.value.length - 1].tracks = await walkDirectory(
      playList.path
    );

    // 如果添加后只有一个歌单，则自动选中
    if (playLists.value.length === 1) {
      playingPlayListIndex.value = 0;
      playingTrackIndex.value = 0;
    }

    // 保存歌单列表
    writePlayListToFile(playListsFile);
  }
});

// 删除歌单
let willPlayListIndex = 0 as number;
function showPlayListMenu(index: number) {
  willPlayListIndex = index;
  ipcRenderer.send("showPlayListMenu");
}
ipcRenderer.on("showPlayListMenu-reply", (event: any, arg: any) =>
  handlePlayListMenu(arg)
);
function handlePlayListMenu(arg: any) {
  switch (arg) {
    case "delete":
      ipcRenderer.send("dialogDeletePlayList", "确定要删除该歌单吗？");
      break;
    case "locateInExplorer":
      shell.openPath(playLists.value[willPlayListIndex].path);
      break;
  }
}
ipcRenderer.on("dialogDeletePlayList-reply", (event: any, arg: any) => {
  if (arg === 0) {
    // 如果正在播放的歌曲 在 要删除的歌单中
    if (playingPlayListIndex.value === willPlayListIndex) {
      playingPlayListIndex.value = 0;
      playingTrackIndex.value = 0;
    } else {
      // 如果正在播放的歌曲 在 要删除的歌单之前
      if (playingPlayListIndex.value > willPlayListIndex) {
        playingPlayListIndex.value--;
      }
    }

    // 如果正在显示的歌单是要删除的歌单
    if (showingPlayListIndex.value === willPlayListIndex) {
      showingPlayListIndex.value = 0;
    } else {
      // 如果正在显示的歌单 在 要删除的歌单之前
      if (showingPlayListIndex.value > willPlayListIndex) {
        showingPlayListIndex.value--;
      }
    }

    playLists.value.splice(willPlayListIndex, 1);
    writePlayListToFile(playListsFile);
  }

  // 删除缓存
  const peakCacheDir = path.resolve(
    process.cwd(),
    "cache",
    "peak_data",
    willPlayListIndex + ""
  );
  fs.rm(peakCacheDir, { recursive: true }, (err: any) => {
    if (err) {
      console.error("删除 peak data 缓存时出错", err);
    }
  });
});

// 将歌单信息保存到文件中
function writePlayListToFile(path: string) {
  const content = JSON.stringify(playLists.value);
  // console.log(content);
  fs.writeFile(path, content, (err: any) => {
    if (err) {
      console.error("保存播放列表失败", err);
      return;
    }
    console.log("保存播放列表成功");
  });
}

// function exportPlayList() {
//   ipcRenderer.send("dialogSaveFile");
// }
// ipcRenderer.on("dialogSaveFile-reply", (event: any, arg: any) => {
//   if (!arg.canceled) {
//     // console.log(arg);
//     writePlayListToFile(arg.filePaths[0]);
//   }
// });
</script>

<template>
  <div id="left-menu">
    <div id="left-menu__playlists">
      <div class="left-menu__playlists-header">
        <div class="title">我的歌单</div>

        <div style="display: flex; gap: 8px">
          <svg
            @click="addPlayList"
            class="left-menu__playlists-add"
            xmlns="http://www.w3.org/2000/svg"
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="#4e5969"
          >
            <title>添加歌单</title>
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>

          <svg
            v-show="!isLoading"
            @click="refreshPlayList"
            class="left-menu__playlists-add"
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            width="18px"
            viewBox="0 0 24 24"
            fill="#4e5969"
          >
            <title>重新扫描所有歌单</title>
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
          <svg
            v-show="isLoading"
            class="loading-turn"
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            width="18px"
            viewBox="0 0 24 24"
            fill="#4e5969"
          >
            <title>正在扫描中</title>
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
            />
          </svg>
        </div>
        <!-- <svg
          @click="exportPlayList"
          class="left-menu__playlists-add"
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 0 24 24"
          width="20px"
          fill="#4e5969"
        ><title>导出歌单</title>
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg> -->
      </div>

      <template v-for="(item, index) in playLists">
        <div
          @contextmenu.prevent="showPlayListMenu(index)"
          :id="'playlist-' + item.id"
          :title="item.path"
          :class="
            'playlist-title' +
            (showingPlayListIndex === index ? ' playlist-active' : '')
          "
          @click="showingPlayListIndex = index"
        >
          {{
            item.path.substring(
              item.path.lastIndexOf("/") + 1,
              item.path.length
            )
          }}
        </div>
      </template>
    </div>
  </div>
</template>

<style>
#left-menu {
  background-color: #fbfcfe;
  /* background: #efefef; */
  width: 220px;
  height: calc(100% - 48px - 72px);
  position: absolute;
  left: 0;
  top: 48px;
  box-sizing: border-box;

  overflow-y: auto;
  scroll-behavior: smooth;
}
#left-menu::-webkit-scrollbar {
  width: 10px;
}
#left-menu::-webkit-scrollbar-track {
  background-color: transparent;
}
#left-menu::-webkit-scrollbar-thumb {
  background-color: #e5e6eb;
  border-radius: 4px;
}
#left-menu::-webkit-scrollbar-thumb:hover {
  background-color: #c9cdd4;
}
#left-menu__playlists {
  padding-right: 16px;
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  justify-self: center;
}
.left-menu__playlists-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 5px 10px;
}
.left-menu__playlists-header .title {
  font-size: 12px;
  font-weight: 300;
  line-height: 161.8%;
  color: #4e5969;
}
.left-menu__playlists-add:hover {
  cursor: pointer;
}
.playlist-title {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: 500;
  line-height: 161.8%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-left: 2px solid #fbfcfe;
}
.playlist-title:hover,
.playlist-title.playlist-active {
  cursor: pointer;
  /* background-color: #efefef; */
  background: linear-gradient(0.25turn, #e8f3ff, #fbfcfe);
  color: #165dff;
  border-left: 2px solid #165dff;
}
.loading-turn {
  /* turn : 定义的动画名称
     1s : 动画时间
     linear : 动画以何种运行轨迹完成一个周期
     infinite :规定动画应该无限次播放 */
  animation: turn 2s linear infinite;
}
@keyframes turn {
  0% {
    -webkit-transform: rotate(0deg);
  }
  25% {
    -webkit-transform: rotate(90deg);
  }
  50% {
    -webkit-transform: rotate(180deg);
  }
  75% {
    -webkit-transform: rotate(270deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}
</style>
