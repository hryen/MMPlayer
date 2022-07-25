<script setup lang="ts">
import { usePlayerStore } from "@/stores/player";
import { storeToRefs } from "pinia";
const playerStore = usePlayerStore();
const { isFullPage, track, coverArt, nextLrcIndex, loopMode, isPlaying } =
  storeToRefs(playerStore);
</script>

<template>
  <div id="full-page-container" v-show="isFullPage">
    <div id="track-info-container">
      <img
        id="track-cover"
        :src="
          coverArt.startsWith('.')
            ? coverArt
            : 'data:image/png;base64,' + coverArt
        "
        alt="Cover"
      />
      <div id="track-title" :title="track.title">{{ track.title }}</div>
      <div id="track-artist" :title="track.artist">{{ track.artist }}</div>

      <div class="player-controls__buttons">
        <!-- https://www.iconfinder.com/icons/9026032/repeat_icon -->
        <svg
          v-show="loopMode === 'repeat'"
          @click="playerStore.togglePlayMode()"
          width="30"
          height="30"
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
          width="30"
          height="30"
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
          width="30"
          height="30"
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
          width="30"
          height="30"
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
          width="64"
          height="64"
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
          width="64"
          height="64"
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
          width="30"
          height="30"
          viewBox="0 0 16 16"
        >
          <title>下一首</title>
          <path
            stroke="none"
            d="M2 2.96495C2 2.15413 2.91427 1.68039 3.57668 2.14798L10.7097 7.18302C11.2741 7.58143 11.2741 8.41854 10.7097 8.81695L3.57668 13.852C2.91427 14.3196 2 13.8458 2 13.035V2.96495zM14 2.75C14 2.33579 13.6642 2 13.25 2 12.8358 2 12.5 2.33579 12.5 2.75V13.25C12.5 13.6642 12.8358 14 13.25 14 13.6642 14 14 13.6642 14 13.25V2.75z"
          />
        </svg>

        <!-- https://www.iconfinder.com/iconsets/phosphor-regular-vol-4 -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 256 256"
        >
          <!-- <title>下一首</title> -->
          <rect height="256" width="256" stroke="none" fill="none" />
          <path
            d="M80,168H32a8,8,0,0,1-8-8V96a8,8,0,0,1,8-8H80l72-56V224Z"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          />
          <line
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
            x1="192"
            x2="192"
            y1="104"
            y2="152"
          />
          <line
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
            x1="224"
            x2="224"
            y1="88"
            y2="168"
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
    </div>
    <div
      id="lyrics-container"
      :style="
        track.lyricsList && track.lyricsList.length === 1
          ? 'justify-content:center'
          : ''
      "
    >
      <template v-for="(item, index) in track.lyricsList">
        <!-- 显示11行歌词 -->
        <p
          :id="'lyrics-line' + index"
          :class="{ highlight: nextLrcIndex - 1 === index }"
        >
          {{ item.text }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
#full-page-container {
  width: 100%;
  height: calc(100% - 72px - 48px);
  border-bottom: 1px solid #f7f8fa;
  /* border-radius: 16px 16px 0 0; */
  background-color: #fbfcfe;
  position: absolute;
  top: 48px;
  left: 0;

  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}

#track-info-container {
  width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
}
#track-cover {
  width: 288px;
  height: 288px;
}
#track-title,
#track-artist {
  margin-top: 16px;
  width: 288px;

  line-height: 1.6;
  user-select: text;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  font-size: 24px;
  font-weight: bold;
  color: #333;
}
#track-artist {
  margin-top: 0;
  font-size: 16px;
  font-weight: normal;
}

.player-controls__buttons {
  width: 288px;
  margin-top: 16px;
}
.player-controls__buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.player-controls__buttons svg {
  cursor: pointer;
  fill: #4080ff;
  stroke: #4080ff;
}
.player-controls__buttons svg:hover {
  fill: #165dff;
  stroke: #165dff;
}

#lyrics-container {
  width: 60%;
  height: 440px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  overflow-y: scroll;
  scroll-behavior: smooth;

  overflow-x: hidden;

  user-select: text;
}
#lyrics-container::-webkit-scrollbar {
  width: 10px;
}
#lyrics-container::-webkit-scrollbar-track {
  background-color: transparent;
}
#lyrics-container::-webkit-scrollbar-thumb {
  background-color: #e5e6eb;
  border-radius: 4px;
}
#lyrics-container::-webkit-scrollbar-thumb:hover {
  background-color: #c9cdd4;
}

#lyrics-container p {
  line-height: 20px;
  margin: 0;
  padding: 10px 30px;
  font-size: 16px;

  text-align: center;
  width: 90%;
}
#lyrics-container p.highlight {
  font-weight: bold;
  transform: scale(1.1);
}
</style>
