<script setup lang="ts">
import { storeToRefs } from "pinia";
import { usePlaylistStore } from "@/stores/playlist";
import { usePlayerStore } from "@/stores/player";

const { playlists, showingPlaylistId } = storeToRefs(usePlaylistStore());

const playerStore = usePlayerStore();
const { track } = storeToRefs(playerStore);

// 右键菜单
const { ipcRenderer, shell } = require("electron");
function showTrackMenu(index: number) {
  ipcRenderer.send("showTrackMenu", index);
}
ipcRenderer.on(
  "showTrackMenu-reply",
  (_event: any, menu: string, index: number) => {
    switch (menu) {
      case "play":
        playerStore.playWithPlaylistId(index);
        break;
      case "locateInExplorer":
        shell.showItemInFolder(
          playlists.value[showingPlaylistId.value].tracks[index].path
        );
        break;
    }
  }
);

// TODO: backToTop
function backToTop() {
  const firstElement = document.getElementById("track-0");
  if (firstElement) {
    firstElement.scrollIntoView();
  }
}
</script>

<template>
  <div id="track-lists">
    <div id="track-list__title" class="track">
      <div class="track-index">#</div>
      <div class="track-title">标题</div>
      <div class="track-artist">歌手</div>
      <div class="track-album">专辑</div>
    </div>

    <template
      v-if="
        playlists[showingPlaylistId] &&
        playlists[showingPlaylistId].tracks.length > 0
      "
    >
      <div
        v-for="(item, index) in playlists[showingPlaylistId].tracks"
        @contextmenu.prevent="showTrackMenu(index)"
        :id="'track-' + index"
        :class="[
          'track',
          { 'track-active track-playing': track.id === item.id },
        ]"
      >
        <!-- TODO: 如果是当前播放的歌曲，按钮显示为暂停 -->
        <div @click="playerStore.playWithPlaylistId(index)" class="track-index">
          {{ index + 1 }}
        </div>
        <div class="track-title" :title="item.title">
          {{ item.title }}
        </div>
        <div class="track-artist" :title="item.artist">
          {{ item.artist }}
        </div>
        <div class="track-album" :title="item.album">
          {{ item.album }}
        </div>
      </div>
    </template>

    <template v-else>
      <div style="text-align: center; font-size: 14px">
        该列表没有扫描到歌曲
      </div>
    </template>
  </div>
</template>

<style>
#track-lists {
  background-color: #f7f8fa;
  width: calc(100% - 220px);
  height: calc(100% - 72px - 81px);

  position: absolute;
  top: 81px;
  left: 220px;
  padding-left: 10px;

  overflow-y: scroll;
  scroll-behavior: smooth;
}
#track-lists::-webkit-scrollbar {
  width: 10px;
}
#track-lists::-webkit-scrollbar-track {
  background-color: transparent;
}
#track-lists::-webkit-scrollbar-thumb {
  background-color: #e5e6eb;
  border-radius: 4px;
}
#track-lists::-webkit-scrollbar-thumb:hover {
  background-color: #c9cdd4;
}

#track-list__title {
  background-color: #f7f8fa;
  position: fixed;
  width: calc(100% - 220px - 12px);
  height: 33px;
  top: 54px;
  left: 226px;
  padding: 0 10px;
}

#track-list__title {
  color: #4e5969;
  user-select: none;
}
#track-list__title:hover {
  background-color: #f7f8fa;
  border-left: 2px solid #f7f8fa;
}
#track-list__title:hover .track-index {
  background-image: none;
  color: #4e5969;
  cursor: unset;
}

#track-list {
  width: 100%;
}
.track {
  border-left: 2px solid #f7f8fa;
  display: flex;
  padding: 5px 0;
  font-size: 14px;
  box-sizing: border-box;
  line-height: 161.8%;
}
.track:hover,
.track-active {
  border-left: 2px solid #165dff;
  color: #165dff;
  background-color: #f2f3f5;
}
.track-index {
  width: 6%;
  min-width: 30px;
  text-align: center;
  cursor: pointer;
}
.track:hover .track-index,
.track-active .track-index {
  background-image: url("../assets/play_arrow.svg");
  background-position: center;
  background-repeat: no-repeat;
  color: transparent;
}
.track-playing .track-index {
  background-image: url("../assets/equalizer.svg");
}
.track-title,
.track-artist,
.track-album {
  padding-right: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track-title {
  width: 38%;
  padding-left: 0;
}
.track-artist,
.track-album {
  width: 28%;
}
</style>
