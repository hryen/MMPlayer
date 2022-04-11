<script setup lang="ts">
import { useMainStore } from "@/stores/main";
import { usePlayerStore } from "@/stores/player";
import { storeToRefs } from "pinia";

const mainStore = useMainStore();
const { playLists, showingPlayListIndex } = storeToRefs(mainStore);

const playerStore = usePlayerStore();
const { playingPlayListIndex, playingTrackIndex } = storeToRefs(playerStore);

const { ipcRenderer, shell } = require("electron");
let willTrackIndex = 0 as number;
let willPlayListIndex = 0 as number;
function showTrackMenu(trackIndex: number, playListIndex: number) {
  willTrackIndex = trackIndex;
  willPlayListIndex = playListIndex;
  ipcRenderer.send("showTrackMenu");
}

ipcRenderer.on("showTrackMenu-reply", (event: any, arg: any) =>
  handleTrackMenu(arg)
);
function handleTrackMenu(arg: any) {
  switch (arg) {
    case "play":
      playerStore.play(willTrackIndex, willPlayListIndex);
      break;
    case "locateInExplorer":
      shell.showItemInFolder(
        playLists.value[willPlayListIndex].tracks[willTrackIndex].path
      );
      break;
  }
}

// TODO: backToTop
// function backToTop() {
//   console.log("track-" + currentPlayListId + "-" + "0");
//   window.location.href = "track-" + currentPlayListId + "-" + "0";
// }
</script>

<template>
  <div id="track-lists">
    <div id="track-list__title" class="track">
      <div class="track-index">#</div>
      <div class="track-title">标题</div>
      <div class="track-artist">歌手</div>
      <div class="track-album">专辑</div>
    </div>

    <template v-for="(playList, playListIndex) in playLists">
      <div
        :id="'track-list-' + playListIndex"
        v-show="showingPlayListIndex === playListIndex"
      >
        <template v-if="playList.tracks.length === 0">
          <div style="text-align: center; font-size: 14px">
            该列表没有扫描到歌曲
          </div>
        </template>

        <template v-else>
          <div
            @contextmenu.prevent="showTrackMenu(trackIndex, playListIndex)"
            v-for="(track, trackIndex) in playList.tracks"
            :id="'track-' + playListIndex + '-' + trackIndex"
            :class="
              'track' +
              (playingPlayListIndex === playListIndex &&
              playingTrackIndex === trackIndex
                ? ' track-active track-playing'
                : '')
            "
          >
            <div
              @click="playerStore.play(trackIndex, playListIndex)"
              class="track-index"
            >
              {{ trackIndex + 1 }}
            </div>
            <div class="track-title" :title="track.title">
              {{ track.title }}
            </div>
            <div class="track-artist" :title="track.artist">
              {{ track.artist }}
            </div>
            <div class="track-album" :title="track.album">
              {{ track.album }}
            </div>
          </div>
        </template>
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
