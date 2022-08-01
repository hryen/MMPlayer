<script setup lang="ts">
import { usePlayerStore } from "@/stores/player";
import { useLyricStore } from "@/stores/lyric";
import { storeToRefs } from "pinia";
import { watch } from "vue";

const playerStore = usePlayerStore();
const {
  track,
  trackCoverImage,
  isPlaying,
  trackCurrentTime,
  trackDuration,
  loopMode,
  playingPlaylistId,
} = storeToRefs(playerStore);

watch(track, () => {
  const path = require("path");
  trackCoverImage.value = path.resolve(
    process.cwd(),
    "cache",
    "export_image",
    track.value.id + ".jpg"
  );
});
watch(playingPlaylistId, () => {
  if (loopMode.value == "shuffle") playerStore.shufflePlayingPlaylistArray();
});

const lyricStore = useLyricStore();

// 监听任务栏缩略图按钮事件
const { ipcRenderer } = require("electron");
ipcRenderer.on("playPrev", (_event: any, _arg: any) => {
  playerStore.playPrev();
});
ipcRenderer.on("playPause", (_event: any, _arg: any) => {
  playerStore.playPause();
});
ipcRenderer.on("playNext", (_event: any, _arg: any) => {
  playerStore.playNext();
});

// https://github.com/katspaugh/wavesurfer.js/blob/00b9f7e4dcd04f66b5c7a3ae552aa9fb6ed588b4/example/angular-material/wavesurfer.directive.js#L97
function timeFormat(input: number) {
  if (!input) {
    return "00:00";
  }

  const minutes = Math.floor(input / 60);
  const seconds = Math.floor(input) % 60;

  return (
    (minutes < 10 ? "0" : "") +
    minutes +
    ":" +
    (seconds < 10 ? "0" : "") +
    seconds
  );
}
</script>

<template>
  <div id="player">
    <div id="player-track-info">
      <div id="track-cover">
        <img
          id="track-cover__img"
          :src="trackCoverImage"
          @error="playerStore.handleImageError"
          alt="Cover"
          @click="lyricStore.toggleVisible()"
        />
      </div>
      <div id="track-info">
        <div
          id="track-title"
          :title="track.title + '\r单击可定位至该歌曲'"
          @click="playerStore.locatePlayingTrack()"
        >
          {{ track.title }}
        </div>
        <div id="track-artist" :title="track.artist">
          {{ track.artist }}
        </div>
      </div>
    </div>

    <div id="player-controls">
      <div id="player-controls__buttons">
        <!-- https://www.iconfinder.com/icons/9026032/repeat_icon -->
        <svg
          v-show="loopMode === 'repeat'"
          @click="playerStore.togglePlayMode()"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
        >
          <title>列表循环</title>
          <rect fill="none" height="256" width="256" stroke="none" />
          <polyline
            fill="none"
            points="200 88 224 64 200 40"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <path
            d="M32,128A64.1,64.1,0,0,1,96,64H224"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <polyline
            fill="none"
            points="56 168 32 192 56 216"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <path
            d="M224,128a64.1,64.1,0,0,1-64,64H32"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
        </svg>

        <!-- https://www.iconfinder.com/icons/9026070/repeat_once_icon -->
        <svg
          v-show="loopMode === 'repeatOne'"
          @click="playerStore.togglePlayMode()"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
        >
          <title>单曲循环</title>
          <rect fill="none" height="256" width="256" stroke="none" />
          <polyline
            fill="none"
            points="200 88 224 64 200 40"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <path
            d="M32,128A64.1,64.1,0,0,1,96,64H224"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <polyline
            fill="none"
            points="56 168 32 192 56 216"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <path
            d="M224,128a64.1,64.1,0,0,1-64,64H32"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <polyline
            fill="none"
            points="116 112 132 104 132 152"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
        </svg>

        <!-- https://www.iconfinder.com/icons/9026085/shuffle_icon -->
        <svg
          v-show="loopMode === 'shuffle'"
          @click="playerStore.togglePlayMode()"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          id="Layer_1"
          x="0"
          y="0"
          version="1.1"
          viewBox="0 0 256 256"
          xml:space="preserve"
        >
          <title>随机播放</title>
          <rect fill="none" height="256" width="256" stroke="none" />
          <path
            d="M32,72H55.1a64,64,0,0,1,52,26.8l41.8,58.4a64,64,0,0,0,52,26.8H232"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <polyline
            fill="none"
            points="208 48 232 72 208 96"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <polyline
            fill="none"
            points="208 160 232 184 208 208"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <path
            d="M147.7,100.5l1.2-1.7a64,64,0,0,1,52-26.8H232"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <path
            d="M32,184H55.1a64,64,0,0,0,52-26.8l1.2-1.7"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
        </svg>

        <!-- https://iconscout.com/icon/previous-2653729 -->
        <svg
          @click="playerStore.playPrev()"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
        >
          <title>上一首</title>
          <path
            stroke="none"
            d="M13.75 13.0351C13.75 13.8459 12.8357 14.3196 12.1733 13.852L5.04034 8.81698C4.47592 8.41857 4.47592 7.58146 5.04034 7.18305L12.1733 2.14801C12.8357 1.68042 13.75 2.15416 13.75 2.96498L13.75 13.0351zM1.75 13.25C1.75 13.6642 2.08579 14 2.5 14 2.91421 14 3.25 13.6642 3.25 13.25L3.25 2.75C3.25 2.33579 2.91421 2 2.5 2 2.08579 2 1.75 2.33579 1.75 2.75V13.25z"
          />
        </svg>

        <!-- https://iconscout.com/icon/play-1912208 -->
        <svg
          v-show="!isPlaying"
          @click="playerStore.playPause()"
          xmlns="http://www.w3.org/2000/svg"
          width="42"
          height="42"
          viewBox="0 0 24 24"
        >
          <title>播放</title>
          <path
            stroke="none"
            d="M7 17.259V6.74104C7 5.96925 7.83721 5.48838 8.50387 5.87726L17.5192 11.1362C18.1807 11.5221 18.1807 12.4779 17.5192 12.8638L8.50387 18.1227C7.83721 18.5116 7 18.0308 7 17.259Z"
          />
        </svg>

        <!-- https://iconscout.com/icon/pause-1912210 -->
        <svg
          v-show="isPlaying"
          @click="playerStore.playPause()"
          xmlns="http://www.w3.org/2000/svg"
          width="42"
          height="42"
          viewBox="0 0 24 24"
        >
          <title>暂停</title>
          <path
            stroke="none"
            d="M8 5C6.89543 5 6 5.89543 6 7V17C6 18.1046 6.89543 19 8 19 9.10457 19 10 18.1046 10 17V7C10 5.89543 9.10457 5 8 5zM16 5C14.8954 5 14 5.89543 14 7V17C14 18.1046 14.8954 19 16 19 17.1046 19 18 18.1046 18 17V7C18 5.89543 17.1046 5 16 5z"
          />
        </svg>

        <!-- https://iconscout.com/icon/next-2653752 -->
        <svg
          @click="playerStore.playNext()"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
        >
          <title>下一首</title>
          <path
            stroke="none"
            d="M2 2.96495C2 2.15413 2.91427 1.68039 3.57668 2.14798L10.7097 7.18302C11.2741 7.58143 11.2741 8.41854 10.7097 8.81695L3.57668 13.852C2.91427 14.3196 2 13.8458 2 13.035V2.96495zM14 2.75C14 2.33579 13.6642 2 13.25 2 12.8358 2 12.5 2.33579 12.5 2.75V13.25C12.5 13.6642 12.8358 14 13.25 14 13.6642 14 14 13.6642 14 13.25V2.75z"
          />
        </svg>

        <!-- <div id="player-controls__volume">
            <span id="player-controls__volume_icon" class="material-icons md-20"
              >volume_up</span
            >
            <input
              id="player-controls__volume_slide"
              class="slider"
              type="range"
              min="0"
              max="100"
              value="80"
            />
            <label
              id="player-controls__volume_label"
              for="player-controls__volume_slide"
              >80%</label
            >
          </div> -->
      </div>
      <div id="player-controls__bar">
        <div id="player-controls__waveform"></div>
        <div id="player-controls__curr-time">
          {{ timeFormat(trackCurrentTime) }}
        </div>
        &nbsp;/&nbsp;
        <div id="player-controls__total-time">
          {{ timeFormat(trackDuration) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#player {
  background-color: #ffffff;
  width: 100%;
  height: 72px;
  border-radius: 0 0 8px 8px;

  position: absolute;
  bottom: 0;
  left: 0;

  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
#player-track-info {
  width: 220px;
  display: flex;
}
#track-cover {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
#track-cover__img {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  cursor: pointer;
}

#track-info {
  width: 148px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.6;

  user-select: text;
  padding-right: 12px;
}
#track-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  cursor: pointer;
}
#track-artist {
  font-size: 12px;
  color: #333;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

#player-controls {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
  gap: 30px;
}

#player-controls__buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

#player-controls__buttons svg {
  cursor: pointer;
  fill: #4080ff;
  stroke: #4080ff;
}

#player-controls__buttons svg:hover {
  fill: #165dff;
  stroke: #165dff;
}

#player-controls__bar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  color: #999;
  font-size: 12px;
}

#player-controls__waveform {
  width: 100%;
  position: relative;
}

#player-controls__curr-time {
  text-align: right;
  padding-left: 10px;
}

/* volume */
/* #player-controls__volume {
  display: flex;
  align-items: center;
  gap: 3px;
}
#player-controls__volume_slide {
  -webkit-appearance: none;
  width: 80px;
  height: 5px;
  border-radius: 2px;
  background: #d3d3d3;
  outline: none;
  opacity: 0.8;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}
#player-controls__volume_slide:hover {
  opacity: 1;
}
#player-controls__volume_slide::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff7700;
  cursor: pointer;
}
#player-controls__volume_slide::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff7700;
  cursor: pointer;
}
#player-controls__volume_label {
  font-size: 12px;
  color: #999;
  width: 30px;
  visibility: hidden;
} */
</style>
