import { defineStore, storeToRefs } from "pinia";
import { usePlayerStore } from "@/stores/player";
import { nextTick } from "vue";

export const useLyricStore = defineStore("lyric", {
  state: () => ({
    lyricPageVisible: false as boolean,
    lyricInterval: null as any,
    nextLyricIndex: 1 as number,
  }),
  actions: {
    getLyric() {
      const { track } = storeToRefs(usePlayerStore());
      if (!track.value.path) return;

      let lyricFile = track.value.path;
      lyricFile = lyricFile.substring(0, lyricFile.lastIndexOf(".")) + ".lrc";
      lyricFile = lyricFile.replaceAll("\\", "/");
      // console.log(lyricFile);

      let lyricContent = "";
      try {
        const fs = require("fs");
        const iconvlite = require("iconv-lite");
        const data = fs.readFileSync(lyricFile);
        const chardet = require("chardet");
        const encoding = chardet.detect(data);
        lyricContent = iconvlite.decode(data, encoding);
        // console.log(lyricContent);
      } catch (err: any) {
        if (err.code === "ENOENT") {
          track.value.lyrics = [{ time: 0, text: "未找到歌词文件" }];
        } else {
          track.value.lyrics = [{ time: 0, text: "加载歌词文件出错" }];
          console.error(err);
        }
        this.nextLyricIndex = 1;
        return;
      }

      const lyrics = lyricContent.split("\n");
      // console.log(lyrics);
      const lyricArray = [];
      for (let i = 0; i < lyrics.length; i++) {
        let lyric = lyrics[i];
        if (lyric.match(/^\[.*?](\r)?$/)) {
          continue;
        }

        let timeMatch = lyric.match(/\[(\d{2}):(\d{2})(\.|:)(\d+)]/);
        if (timeMatch) {
          let min = parseInt(timeMatch[1]);
          let sec = parseInt(timeMatch[2]);
          let ms = parseInt(timeMatch[4]);
          const time = min * 60 + sec + ms / 1000;
          let text = lyric.replace(/\[(\d{2}):(\d{2})(\.|:)(\d+)]/, "");
          lyricArray.push({
            time: time,
            text: text.replaceAll("\r", ""),
          });
        }
      }
      track.value.lyrics = lyricArray;
      // console.log(this.track.lyrics);
      this.nextLyricIndex = 1;
      this.showLyric(0);
    },
    toggleVisible() {
      if (this.lyricPageVisible) {
        this.lyricPageVisible = false;
      } else {
        if (usePlayerStore().getTrack.title) {
          this.lyricPageVisible = true;
          nextTick(() => {
            this.seekLyric();
          });
        }
      }
      // window.dispatchEvent(new Event("resize"));
    },
    startLyricInterval() {
      const { track, trackCurrentTime } = storeToRefs(usePlayerStore());

      const lyrics = track.value.lyrics;
      if (!lyrics || lyrics.length <= 1) return;

      const _this = this;
      this.lyricInterval = setInterval(function () {
        const l = lyrics[_this.nextLyricIndex];
        if (_this.nextLyricIndex === lyrics.length) return;

        if (trackCurrentTime.value >= l.time) {
          _this.showLyric(_this.nextLyricIndex - 1);
          _this.nextLyricIndex++;
        }
      }, 300);
    },
    clearLyricInterval() {
      clearInterval(this.lyricInterval);
    },
    showLyric(line: number) {
      if (!this.lyricPageVisible) return;

      const lyricElement = document.getElementById("lyric-" + line);
      if (lyricElement) {
        lyricElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    seekLyric() {
      const { track, trackCurrentTime } = storeToRefs(usePlayerStore());

      const lyrics = track.value.lyrics;
      if (!lyrics || lyrics.length <= 1) return;

      if (trackCurrentTime.value > lyrics[lyrics.length - 1].time) {
        this.nextLyricIndex = lyrics.length;
      } else {
        for (let i = 1; i <= lyrics.length; i++) {
          if (lyrics[i].time > trackCurrentTime.value) {
            this.nextLyricIndex = i;
            break;
          }
        }
      }

      this.showLyric(this.nextLyricIndex - 1);
    },
    closeLyricPage() {
      this.lyricPageVisible = false;
    },
    resetLyricIndex() {
      this.nextLyricIndex = 1;
      this.showLyric(0);
    }
  },
});
