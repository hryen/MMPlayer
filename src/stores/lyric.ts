import { defineStore, storeToRefs } from "pinia";
import { usePlayerStore } from "@/stores/player";

export const useLyricStore = defineStore("lyric", {
  state: () => ({
    lyricPageVisible: false as boolean,
    lyricElements: [] as any,

    lyricInterval: null as any,
    nextLyricIndex: 1 as number,
  }),
  actions: {
    toggleVisible() {
      this.lyricPageVisible = !this.lyricPageVisible;
      // window.dispatchEvent(new Event("resize"));

      // TODO: 任务栏缩略图裁剪不准确，待放弃裁剪任务栏缩略图
      const { ipcRenderer } = require("electron");
      if (this.lyricPageVisible) {
        ipcRenderer.send("set-thumbnail-clip", "lyric");
      } else {
        ipcRenderer.send("set-thumbnail-clip");
      }
    },
    startLyricInterval() {
      const playerStore = usePlayerStore();
      const { track, trackCurrentTime } = storeToRefs(playerStore);

      // TODO: 改名 track.value.lyricsList -> track.value.lyrics
      const lyrics = track.value.lyricsList;
      if (!lyrics || lyrics.length <= 1) {
        return;
      }

      const _this = this;
      this.lyricInterval = setInterval(function () {
        const l = lyrics[_this.nextLyricIndex];
        if (_this.nextLyricIndex === lyrics.length) {
          return;
        }

        if (trackCurrentTime.value >= l.time) {
          _this.showLyric(_this.nextLyricIndex);
          _this.nextLyricIndex++;
        }
      }, 300);
    },
    clearLyricInterval() {
      clearInterval(this.lyricInterval);
    },
    showLyric(line: number) {
      if (!this.lyricPageVisible) {
        return;
      }

      console.log("showLyric", line);
      if (line >= 5) {
        line -= 5;
      } else {
        line = 0;
      }

      document.getElementById("lyrics").scrollTop =
        document.getElementById("lyric-" + line).offsetTop +
        document.getElementById("lyric-" + line).offsetParent.offsetTop -
        120; // 40是一行的高度，减去3行的高度
      // console.log(this.lyricElements.value);
      // if (this.lyricElements.value) {
      //   // const parentElement = this.lyricElements.value[line].parentElement;

      //   // console.log("lyrics scrollTop", this.lyricElements.value[line].parentElement.scrollTop);
      //   // console.log("lyric offsetTop", this.lyricElements.value[line].offsetTop);
      //   // console.log("lyric offsetParent offsetTop", this.lyricElements.value[line].offsetParent.offsetTop);

      //   this.lyricElements.value[line].parentElement.scrollTop =
      //     this.lyricElements.value[line].offsetTop +
      //     this.lyricElements.value[line].offsetParent.offsetTop -
      //     120;

      //   // if (this.lyricElements.value[line].offsetParent) {
      //   //   const parent = lyricLines.value[9].offsetParent as HTMLElement;
      //   //   console.log("lyric-line10 offsetParent offsetTop", parent.offsetTop);
      //   // }
      // }
    },
    seekLyric() {
      const playerStore = usePlayerStore();
      const { track, trackCurrentTime } = storeToRefs(playerStore);

      // TODO: 改名 track.value.lyricsList -> track.value.lyrics
      const lyrics = track.value.lyricsList;
      if (!lyrics || lyrics.length <= 1) {
        return;
      }

      if (trackCurrentTime.value > lyrics[lyrics.length - 1].time) {
        this.nextLyricIndex = lyrics.length;
      } else {
        for (let i = 0; i < lyrics.length; i++) {
          if (lyrics[i].time > trackCurrentTime.value) {
            this.nextLyricIndex = i;
            break;
          }
        }
      }

      this.showLyric(this.nextLyricIndex);
    },
    closeLyricPage() {
      this.lyricPageVisible = false;
    },
  },
});
