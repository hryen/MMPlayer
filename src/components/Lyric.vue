<script setup lang="ts">
import { useLyricStore } from "@/stores/lyric";
import { usePlayerStore } from "@/stores/player";
import { storeToRefs } from "pinia";
import { watch } from "vue";

const lyricStore = useLyricStore();
const { lyricPageVisible, nextLyricIndex } = storeToRefs(lyricStore);

const playerStore = usePlayerStore();
const { track, trackCoverImage } = storeToRefs(playerStore);

watch(track, () => {
  lyricStore.getLyric();
});
</script>

<template>
  <div id="lyrics-container" v-show="lyricPageVisible">
    <div id="cover-container">
      <img
        id="cover"
          :src="trackCoverImage"
          @error="playerStore.handleImageError"
        alt="Cover"
      />
    </div>
    <div
      id="lyrics"
      :style="
        track.lyrics && track.lyrics.length === 1
          ? 'justify-content:center'
          : ''
      "
    >
      <template v-for="(item, index) in track.lyrics">
        <!-- 显示11行歌词 -->
        <p
          :id="'lyric-' + index"
          :class="{ highlight: nextLyricIndex - 1 === index }"
        >
          {{ item.text }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
#lyrics-container {
  width: 100%;
  height: calc(100% - 72px - 48px);
  border-bottom: 1px solid #f7f8fa;
  background-color: #fbfcfe;
  position: absolute;
  top: 48px;
  left: 0;

  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}

#cover-container {
  width: 40%;
  display: flex;
  justify-content: flex-end;
}
#cover {
  width: 300px;
  height: 300px;
}

#lyrics {
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
#lyrics::-webkit-scrollbar {
  width: 10px;
}
#lyrics::-webkit-scrollbar-track {
  background-color: transparent;
}
#lyrics::-webkit-scrollbar-thumb {
  background-color: #e5e6eb;
  border-radius: 4px;
}
#lyrics::-webkit-scrollbar-thumb:hover {
  background-color: #c9cdd4;
}

#lyrics p {
  line-height: 20px;
  margin: 0;
  padding: 10px 30px;
  font-size: 16px;

  text-align: center;
  width: 90%;
  word-break: break-word;
}
#lyrics p.highlight {
  font-weight: bold;
  transform: scale(1.1);
}
</style>
