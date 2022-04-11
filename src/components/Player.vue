<script setup lang="ts">
import { onMounted } from "vue";
import { usePlayerStore } from "@/stores/player";
import { storeToRefs } from "pinia";

const playerStore = usePlayerStore();
const {
  track,
  isPlaying,
  trackCurrentTime,
  trackDuration,
  coverArt,
  loopMode,
} = storeToRefs(playerStore);

onMounted(() => {
  playerStore.init();
});

// 监听任务栏缩略图按钮事件
const { ipcRenderer } = require("electron");
ipcRenderer.on("playPrev", (event: any, arg: any) => {
  playerStore.playPrev();
});
ipcRenderer.on("playPause", (event: any, arg: any) => {
  playerStore.playPause();
});
ipcRenderer.on("playNext", (event: any, arg: any) => {
  playerStore.playNext();
});
</script>

<template>
  <div id="player">
    <div id="player-cover">
      <img
        id="player-cover__img"
        :src="
          coverArt.startsWith('.')
            ? coverArt
            : 'data:image/png;base64,' + coverArt
        "
        alt="Cover"
      />
    </div>

    <div id="player-info">
      <div
        id="player-info__title"
        :title="track.title + '\r单击可定位至该歌曲'"
        @click="playerStore.locatePlayingTrack()"
      >
        {{ track.title }}
      </div>
      <div id="player-info__artist" :title="track.artist">
        {{ track.artist }}
      </div>
    </div>

    <div id="player-controls">
      <div id="player-controls__buttons">
        <svg
          v-show="loopMode === 'repeat'"
          @click="playerStore.togglePlayMode()"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
        >
          <title>列表循环</title>
          <path
            d="M7.68 21.35l4-3.71a1 1 0 1 0-1.36-1.47L8 18.33V12a3.91 3.91 0 0 1 3.86-4h9.71a1 1 0 0 0 0-2H11.86A5.91 5.91 0 0 0 6 12v6.37L3.68 16.17a1 1 0 1 0-1.36 1.47l4 3.71a1 1 0 0 0 .16.1 1 1 0 0 0 .14.09 1 1 0 0 0 .75 0 1 1 0 0 0 .14-.09A1 1 0 0 0 7.68 21.35zM29.68 14.93l-4-3.71a1 1 0 0 0-.16-.1 1 1 0 0 0-.14-.09 1 1 0 0 0-.75 0 1 1 0 0 0-.14.09 1 1 0 0 0-.16.1l-4 3.71a1 1 0 1 0 1.36 1.47L24 14.25v6A3.81 3.81 0 0 1 20.14 24H10.43a1 1 0 1 0 0 2h9.71A5.81 5.81 0 0 0 26 20.26v-6l2.32 2.15a1 1 0 1 0 1.36-1.47z"
            data-name="Layer 2"
          />
        </svg>

        <svg
          v-show="loopMode === 'repeatOne'"
          @click="playerStore.togglePlayMode()"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
        >
          <title>单曲循环</title>
          <g data-name="Layer 2">
            <path
              d="M29.77 15l-3-3.64a1 1 0 0 0-1.54 0l-3 3.64a1 1 0 1 0 1.54 1.27L25 14.79v5.28A4 4 0 0 1 20.89 24H6a1 1 0 0 0 0 2H20.89A6 6 0 0 0 27 20.07V14.79l1.23 1.49A1 1 0 1 0 29.77 15zM6 20.48a1 1 0 0 0 .76-.35l3-3.48a1 1 0 0 0-1.52-1.31L7 16.79v-5A3.93 3.93 0 0 1 11.08 8h14.8a1 1 0 0 0 0-2H11.08A5.93 5.93 0 0 0 5 11.74v5L3.76 15.35a1 1 0 0 0-1.52 1.31l3 3.48A1 1 0 0 0 6 20.48z"
            />
            <path
              d="M17,20a1,1,0,0,0,1-1V13s0,0,0,0a1,1,0,0,0,0-.2,1,1,0,0,0-.05-.19v0a1,1,0,0,0-.09-.11,1,1,0,0,0-.13-.17,2.4,2.4,0,0,0-.32-.2,1,1,0,0,0-.21,0A.94.94,0,0,0,17,12h0a3.06,3.06,0,0,0-.39.09h0l-2,1a1,1,0,0,0,.89,1.79l.55-.28V19A1,1,0,0,0,17,20Z"
            />
          </g>
        </svg>

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
          viewBox="0 0 29 29"
          xml:space="preserve"
        >
          <title>随机播放</title>
          <path
            d="M6.843 20H2.5a1 1 0 0 1 0-2h4.343c.79 0 1.563-.32 2.121-.878l6.657-6.657A4.967 4.967 0 0 1 19.157 9H23.5a1 1 0 0 1 0 2h-4.343c-.79 0-1.563.32-2.121.878l-6.657 6.657A4.967 4.967 0 0 1 6.843 20z"
          />
          <path
            d="M23.5 20h-4.343a4.967 4.967 0 01-3.535-1.464l-6.657-6.657A3.02 3.02 0 006.843 11H2.5a1 1 0 010-2h4.343c1.335 0 2.591.52 3.535 1.464l6.657 6.657a3.02 3.02 0 002.122.879H23.5a1 1 0 010 2zM21.5 12.412V7.588c0-.368.401-.596.717-.408l4.052 2.412a.474.474 0 010 .815l-4.052 2.412a.474.474 0 01-.717-.407z"
          />
          <path
            d="M21.5 21.412v-4.823c0-.368.401-.596.717-.408l4.052 2.412a.474.474 0 0 1 0 .815l-4.052 2.412a.475.475 0 0 1-.717-.408z"
          />
        </svg>

        <svg
          @click="playerStore.playPrev()"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
        >
          <title>上一首</title>
          <path
            d="M13.75 13.0351C13.75 13.8459 12.8357 14.3196 12.1733 13.852L5.04034 8.81698C4.47592 8.41857 4.47592 7.58146 5.04034 7.18305L12.1733 2.14801C12.8357 1.68042 13.75 2.15416 13.75 2.96498L13.75 13.0351zM1.75 13.25C1.75 13.6642 2.08579 14 2.5 14 2.91421 14 3.25 13.6642 3.25 13.25L3.25 2.75C3.25 2.33579 2.91421 2 2.5 2 2.08579 2 1.75 2.33579 1.75 2.75V13.25z"
          />
        </svg>

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
            d="M7 17.259V6.74104C7 5.96925 7.83721 5.48838 8.50387 5.87726L17.5192 11.1362C18.1807 11.5221 18.1807 12.4779 17.5192 12.8638L8.50387 18.1227C7.83721 18.5116 7 18.0308 7 17.259Z"
          />
        </svg>
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
            d="M8 5C6.89543 5 6 5.89543 6 7V17C6 18.1046 6.89543 19 8 19 9.10457 19 10 18.1046 10 17V7C10 5.89543 9.10457 5 8 5zM16 5C14.8954 5 14 5.89543 14 7V17C14 18.1046 14.8954 19 16 19 17.1046 19 18 18.1046 18 17V7C18 5.89543 17.1046 5 16 5z"
          />
        </svg>

        <svg
          @click="playerStore.playNext()"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
        >
          <title>下一首</title>
          <path
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
        <div id="player-controls__curr-time">{{ trackCurrentTime }}</div>
        &nbsp;/&nbsp;
        <div id="player-controls__total-time">{{ trackDuration }}</div>
      </div>
    </div>

    <!-- 歌词滚动使用margin-top: -xxxpx，js实现，比如行高是30，margin-top要从-1一直到-30 -->
    <!-- <div id="player-lyrics">
        <div id="player-lyrics__prev"></div>
        <div id="player-lyrics__curr">暂无歌词</div>
        <div id="player-lyrics__next"></div>
      </div> -->
  </div>
</template>

<style>
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

#player-cover {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
#player-cover__img {
  width: 48px;
  height: 48px;
  border-radius: 4px;
}

#player-info {
  width: 148px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.6;

  user-select: text;
}
#player-info__title {
  font-size: 14px;
  font-weight: bold;
  color: #333;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  cursor: pointer;
}
#player-info__artist {
  font-size: 12px;
  color: #333;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

#player-controls {
  width: calc(100% - 220px);
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 10px 0 30px;
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
}

#player-controls__buttons svg:hover {
  fill: #165dff;
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

/* lyrics */
/* #player-lyrics {
  padding: 0 10px;
  width: 24%;
  height: 90px;
  display: flex;
  flex-flow: column;
  justify-content: center;
}
#player-lyrics__prev,
#player-lyrics__curr,
#player-lyrics__next {
  width: 100%;
  font-size: 12px;
  line-height: 161.8%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
  text-align: center;
}
#player-lyrics__curr {
  font-weight: bold;
  font-size: 14px;
} */
</style>
