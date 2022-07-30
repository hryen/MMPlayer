<script setup lang="ts">
import { usePlaylistStore } from "@/stores/playlist";
import { usePlayerStore } from "@/stores/player";
import { storeToRefs } from "pinia";
import { walkDirectory } from "@/utils/musicTool";
import { ref, nextTick } from "vue";
import Spin from "@/components/Spin.vue";

const playlistStore = usePlaylistStore();
const playerStore = usePlayerStore();

const { playlists, showingPlaylistId } = storeToRefs(playlistStore);
const { playingPlaylistIndex, playingTrackIndex } = storeToRefs(playerStore);

const path = require("path");
const fs = require("fs");
const { ipcRenderer, shell } = require("electron");

const isLoading = ref(false);

// 刷新歌单列表
async function initPlaylist() {
  isLoading.value = true;
  await playlistStore.init();
  nextTick(() => {
    // 延迟关闭，防止闪屏
    setTimeout(() => {
      isLoading.value = false;
    }, 300);
  });
}

// 添加歌单
function addPlaylist() {
  ipcRenderer.send("dialogOpenDirectory", false);
}
ipcRenderer.on("dialogOpenDirectory-reply", async (_event: any, arg: any) => {
  // console.log("addPlaylist", arg);
  if (!arg.canceled) {
    isLoading.value = true;
    await walkDirectory(arg.filePaths[0].replaceAll("\\", "/")).catch(
      (stderr: string) => {
        console.error("添加歌单时出错", stderr);
      }
    );
    initPlaylist();
  }
});

// // 删除歌单
// let willPlaylistIndex = 0 as number;
// function showPlaylistMenu(index: number) {
//   willPlaylistIndex = index;
//   ipcRenderer.send("showPlaylistMenu");
// }
// ipcRenderer.on("showPlaylistMenu-reply", (_event: any, arg: any) =>
//   handlePlaylistMenu(arg)
// );
// function handlePlaylistMenu(arg: any) {
//   switch (arg) {
//     case "delete":
//       ipcRenderer.send("dialogDeletePlaylist", "确定要删除该歌单吗？");
//       break;
//     case "locateInExplorer":
//       shell.openPath(playLists.value[willPlaylistIndex].path);
//       break;
//   }
// }
// ipcRenderer.on("dialogDeletePlaylist-reply", (_event: any, arg: any) => {
//   if (arg === 0) {
//     // 如果正在播放的歌曲 在 要删除的歌单中
//     if (playingPlaylistIndex.value === willPlaylistIndex) {
//       playingPlaylistIndex.value = 0;
//       playingTrackIndex.value = 0;
//     } else {
//       // 如果正在播放的歌曲 在 要删除的歌单之前
//       if (playingPlaylistIndex.value > willPlaylistIndex) {
//         playingPlaylistIndex.value--;
//       }
//     }

//     // 如果正在显示的歌单是要删除的歌单
//     if (showingPlaylistIndex.value === willPlaylistIndex) {
//       showingPlaylistIndex.value = 0;
//     } else {
//       // 如果正在显示的歌单 在 要删除的歌单之前
//       if (showingPlaylistIndex.value > willPlaylistIndex) {
//         showingPlaylistIndex.value--;
//       }
//     }

//     playLists.value.splice(willPlaylistIndex, 1);
//     writePlaylistToFile(playListsFile);
//   }

//   // 删除缓存
//   const peakCacheDir = path.resolve(
//     process.cwd(),
//     "cache",
//     "peak_data",
//     willPlaylistIndex + ""
//   );
//   fs.rm(peakCacheDir, { recursive: true }, (err: any) => {
//     if (err) {
//       console.error("删除 peak data 缓存时出错", err);
//     }
//   });
// });

// 右键菜单
function showPlaylistMenu(id: string) {
  ipcRenderer.send("showPlaylistMenu", id);
}
ipcRenderer.on(
  "showPlaylistMenu-reply",
  (_event: any, menu: string, id: string) => {
    switch (menu) {
      case "refresh":
        // TODO: 重新扫描该歌单
        break;
      case "locateInExplorer":
        shell.openPath(playlists.value[id].path);
        break;
      case "delete":
        // TODO: 删除歌单
        break;
    }
  }
);
</script>

<template>
  <div id="left-menu">
    <Spin :loading="isLoading" tip="loading..." />
    <div class="left-menu__playlists-header">
      <div class="title">我的歌单</div>

      <div style="display: flex; gap: 8px">
        <svg
          @click="addPlaylist"
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
          @click="initPlaylist"
          class="left-menu__playlists-add"
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          width="18px"
          viewBox="0 0 24 24"
          fill="#4e5969"
        >
          <title>刷新歌单列表</title>
          <path d="M0 0h24v24H0z" fill="none" />
          <path
            d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
          />
        </svg>
      </div>
      <!-- <svg
          @click="exportPlaylist"
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

    <div id="left-menu__playlists">
      <template v-for="item in playlists">
        <div
          @contextmenu.prevent="showPlaylistMenu(item.id)"
          :id="'playlist-' + item.id"
          :title="item.path"
          :class="[
            'playlist-title',
            { 'playlist-active': showingPlaylistId === item.id },
          ]"
          @click="showingPlaylistId = item.id"
        >
          {{ item.name !== "" ? item.name : item.path }}
        </div>
      </template>
    </div>
  </div>
</template>

<style>
#left-menu {
  background-color: #fbfcfe;
  width: 220px;
  height: calc(100% - 48px - 72px);
  position: absolute;
  left: 0;
  top: 48px;
  box-sizing: border-box;
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

#left-menu__playlists {
  height: calc(100% - 30px);
  padding-right: 16px;
  overflow-y: auto;
  scroll-behavior: smooth;
}
#left-menu__playlists::-webkit-scrollbar {
  width: 10px;
}
#left-menu__playlists::-webkit-scrollbar-track {
  background-color: transparent;
}
#left-menu__playlists::-webkit-scrollbar-thumb {
  background-color: #e5e6eb;
  border-radius: 4px;
}
#left-menu__playlists::-webkit-scrollbar-thumb:hover {
  background-color: #c9cdd4;
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
  background: linear-gradient(0.25turn, #e8f3ff, #fbfcfe);
  color: #165dff;
  border-left: 2px solid #165dff;
}
</style>
