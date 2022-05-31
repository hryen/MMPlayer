<script setup lang="ts">
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
  isFullPage,
} = storeToRefs(playerStore);


function nextLine() {
  document.getElementById("lyrics-container").scrollTop += 36;
}
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
      <div id="track-title">{{ track.title }}</div>
      <div id="track-artist" @click="nextLine">{{ track.artist }}</div>
    </div>
    <div
      id="lyrics-container"
      :style="
        track.lyricsList && track.lyricsList.length === 1
          ? 'justify-content:center'
          : ''
      "
    >
      <p v-for="item in track.lyricsList">{{ item.text }}</p>
    </div>
  </div>
</template>
<style>
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
  align-content: space-around;
  justify-content: space-around;
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

#lyrics-container {
  width: 60%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  overflow-y: scroll;
  scroll-behavior: smooth;
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
  padding: 8px 30px;
}
</style>
