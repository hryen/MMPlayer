<script setup lang="ts">
import { ref } from "vue";
import { usePlayerStore } from "@/stores/player";
import { useLyricStore } from "@/stores/lyric";
import { storeToRefs } from "pinia";
import PlayerSettings from "@/models/playerSettings";
import config from "@/config";

const { ipcRenderer } = require("electron");
const isMaximized = ref(false);

function maximize() {
  ipcRenderer.send("maximize");
}

ipcRenderer.on("maximize-reply", (_event: String, arg: boolean) => {
  isMaximized.value = arg;
});

const playerStore = usePlayerStore();
const { trackCurrentTime, playingPlayListIndex, playingTrackIndex, loopMode } =
  storeToRefs(playerStore);

const lyricStore = useLyricStore();
const { lyricPageVisible } = storeToRefs(lyricStore);
function quit() {
  // 退出前先保存当前播放的歌曲、时间、歌曲列表、播放模式
  // console.log(wavesurfer.value, playingPlayListIndex.value, playingTrackIndex.value, loopMode.value);
  const settings: PlayerSettings = {
    playingPlayListIndex: playingPlayListIndex.value,
    playingTrackIndex: playingTrackIndex.value,
    loopMode: loopMode.value,
    trackCurrentTime: trackCurrentTime.value,
  };
  // console.log(JSON.stringify(setting));
  const fs = require("fs");
  try {
    fs.writeFileSync(config.PlayerSettingsFile, JSON.stringify(settings));
  } catch (err) {
    console.error("保存播放器设置失败", err);
    return;
  }

  // 发送退出消息
  ipcRenderer.send("quit");
}
</script>

<template>
  <div id="app-header">
    <div id="app-header__left">
      <div id="app-header__left_title">
        <span>MMPlayer</span>
      </div>
    </div>
    <div
      id="app-header__right"
      :style="lyricPageVisible ? 'background-color: #fbfcfe;' : ''"
    >
      <!-- <div id="app-header__right_search">
        <input type="text" placeholder="Search" />
      </div> -->

      <!-- TODO: 图标待调整，现在不美观 -->
      <div id="app-header__right_controls">
        <svg
          @click="ipcRenderer.send('minimize')"
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="30"
          data-name="Layer 1"
          viewBox="0 0 512 512"
        >
          <rect
            width="20"
            height="220"
            x="246"
            y="146"
            rx="10"
            transform="rotate(-90 256 256)"
          />
        </svg>

        <!-- <svg
          id="maximize-ico"
          v-if="!isMaximized"
          @click="maximize"
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="30"
          viewBox="0 0 256 256"
        >
          <rect width="256" height="256" fill="none" stroke="none" />
          <rect
            width="88"
            height="88"
            x="80"
            y="80"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="8"
            rx="8"
          />
        </svg>
        <svg
          id="unmaximize-ico"
          v-if="isMaximized"
          @click="maximize"
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="30"
          viewBox="0 0 255.993 255.993"
        >
          <rect width="256" height="256" fill="none" stroke="none" />
          <polyline
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="8"
            points="148 130 162 130 162 70 98 70 98 86"
          />
          <rect
            width="64"
            height="64"
            x="79.998"
            y="87.994"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="8"
          />
        </svg> -->

        <svg
          @click="quit"
          class="close"
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="30"
          viewBox="0 0 512 512"
        >
          <path
            d="M340.2 160l-84.4 84.3-84-83.9-11.8 11.8 84 83.8-84 83.9 11.8 11.7 84-83.8 84.4 84.2 11.8-11.7-84.4-84.3 84.4-84.2z"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<style>
#app-header {
  width: 100%;
  height: 48px;
  -webkit-app-region: drag;
}

#app-header button {
  -webkit-app-region: no-drag;
}

#app-header__left {
  float: left;
  width: 220px;
  height: 100%;
  background-color: #fbfcfe;
  border-radius: 8px 0 0 0;
}

#app-header__left_title {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 0 10px;
  font-size: 16px;
  font-weight: 500;
  line-height: 161.8%;
  color: #4e5969;
}

#app-header__right {
  float: right;
  width: calc(100% - 220px);
  height: 100%;
  background-color: #f7f8fa;
  border-radius: 0 8px 0 0;

  display: flex;
  align-items: center;
  justify-content: flex-end;
}

#app-header__right_search {
  -webkit-app-region: no-drag;
  position: absolute;
  top: 0;
  left: 230px;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 200px;
  height: 48px;
}

#app-header__right_search input {
  width: 100%;
  height: 32px;
  outline: none;
  color: #4e5969;
  background-color: #f7f8fa;
  padding: 0 10px;
  font-size: 14px;
  line-height: 161.8%;
}

#app-header__right_controls {
  position: absolute;
  top: 0;
  right: 0;
}

#app-header svg {
  -webkit-app-region: no-drag;
  cursor: pointer;
  fill: #000;
  stroke: #000;
}

#app-header svg:hover {
  fill: #ffffff;
  stroke: #ffffff;
  background-color: #c9cdd4;
}

#app-header .close:hover {
  background-color: #f76560;
  border-radius: 0 8px 0 0;
}
</style>
