import { defineStore, storeToRefs } from "pinia";
import { Track } from "@/models/track";
import { useMainStore } from "@/stores/main";
import { PlayerSetting } from "@/models/playerSetting";
import { getPeakData } from "@/utils/musicTool";

export const usePlayerStore = defineStore("player", {
  state: () => ({
    wavesurfer: null as any,
    volume: 80 as number,
    playingTrackIndex: 0 as number,
    playingPlayListIndex: 0 as number,
    isPlaying: false as boolean,
    track: {} as Track,
    trackCurrentTime: "00:00" as string,
    trackDuration: "00:00" as string,
    coverArt: "./assets/album_black_48dp.svg" as string,
    loopMode: "repeat" as string, // repeat, repeatOne, shuffle
    prevTrackArray: [] as PrevTrack[],
    shuffledTrackIndexArray: [] as number[],

    volumeInterval: null as any,
    trackCurrentTimeInterval: null as any,
    lyricPageVisible: false as boolean, // 显示歌词页面
    lrcInterval: null as any,
    nextLrcIndex: 1 as number,
  }),
  actions: {
    init() {
      // TODO:
      const mainStore = useMainStore();
      const { playLists } = storeToRefs(mainStore);

      const WaveSurfer = require("wavesurfer.js");
      WaveSurfer.cursor = require("wavesurfer.js/dist/plugin/wavesurfer.cursor");

      var ctx = document.createElement("canvas").getContext("2d") as any;
      var linGrad = ctx.createLinearGradient(0, 16, 0, 50);
      linGrad.addColorStop(0.5, "#94BFFF");
      linGrad.addColorStop(0.5, "#BEDAFF");

      const options = {
        container: "#player-controls__waveform",
        height: 32,
        responsive: 100,

        waveColor: linGrad,
        progressColor: "#4080FF",
        cursorColor: "transparent",
        barWidth: 2,
        barHeight: 1,
        barRadius: 2,

        backend: "MediaElement",
        hideScrollbar: true,
        plugins: [
          WaveSurfer.cursor.create({
            color: "#165DFF",
            width: "1px",
            opacity: "1",
            showTime: true,
            customShowTimeStyle: {
              "background-color": "#FFFFFF",
              padding: "2px",
              "margin-left": "6px",
              "border-radius": "2px",
              "font-size": "12px",
              "font-family": "Arial",
              "line-height": "12px",
              "box-shadow": "0 0 2px #888",
            },
          }),
        ],
      };

      this.wavesurfer = WaveSurfer.create(options);

      // WaveSurfer Events
      this.wavesurfer.on("play", this.handleOnPlay);
      this.wavesurfer.on("pause", this.handleOnPause);
      this.wavesurfer.on("seek", this.handleOnSeek);
      this.wavesurfer.on("finish", this.handleOnFinish);
      this.wavesurfer.on("destroy", this.handleOnDestroy);
      this.wavesurfer.on("waveform-ready", this.handleOnWaveformReady);
      this.wavesurfer.on("interaction", this.handleOnInteraction);

      this.wavesurfer.setVolume(0.8);
      // 读取保存的播放器设置
      try {
        const path = require("path");
        const fs = require("fs");
        const playerSettingFile = path.resolve(
          process.cwd(),
          "playerSetting.json"
        );
        const playerSetting: PlayerSetting = JSON.parse(
          fs.readFileSync(playerSettingFile)
        );

        this.loopMode = playerSetting.loopMode;
        if (playLists.value.length > 0) {
          this.playingPlayListIndex = playerSetting.playingPlayListIndex;
          this.playingTrackIndex = playerSetting.playingTrackIndex;
          this.track =
            playLists.value[this.playingPlayListIndex].tracks[
              this.playingTrackIndex
            ];

          this.wavesurfer.load(this.track.path);
          const that = this;
          const seekToSaved = function () {
            that.wavesurfer.seekTo(
              playerSetting.trackCurrentTime / that.wavesurfer.getDuration()
            );
            that.wavesurfer.un("waveform-ready", seekToSaved);

            that.locatePlayingTrack();
          };
          this.wavesurfer.on("waveform-ready", seekToSaved);
        }

        this.getAndSetTrackInfo();
      } catch (e: any) {
        console.error("读取保存的播放器设置失败");
        console.error(e);
        // 加载第一个列表中的第一首歌曲，不播放
        if (playLists.value.length > 0) {
          this.track = playLists.value[0].tracks[0] || {};

          try {
            const data = getPeakData(
              this.playingPlayListIndex,
              this.playingTrackIndex
            );
            this.wavesurfer.load(this.track.path, data, "metadata");
          } catch (err) {
            this.wavesurfer.load(this.track.path);
          }

          this.getAndSetTrackInfo();
        }
      }
    },
    handleOnPlay() {
      this.isPlaying = true;
      const { ipcRenderer } = require("electron");
      ipcRenderer.send("changePlayStatus", this.isPlaying);
      clearInterval(this.trackCurrentTimeInterval);
      this.trackCurrentTimeInterval = setInterval(
        this.setTrackCurrentTime,
        200
      );
      // TODO: 改变标题： 歌曲名 - 歌手名 - MMPlayer

      this.startLrcInterval();
    },
    handleOnPause() {
      this.isPlaying = false;
      const { ipcRenderer } = require("electron");
      ipcRenderer.send("changePlayStatus", this.isPlaying);
      clearInterval(this.trackCurrentTimeInterval);
      clearInterval(this.lrcInterval);
    },
    handleOnSeek() {
      this.setTrackCurrentTime();
      this.seekLrc();
    },
    handleOnFinish() {
      if (this.loopMode === "repeatOne") {
        this.playPause();
      } else {
        // this.playNext();
        const _this = this;
        setTimeout(function () {
          clearInterval(_this.lrcInterval);
          _this.playNext();
        }, 1000);
      }
    },
    handleOnDestroy() {
      clearInterval(this.trackCurrentTimeInterval);
      clearInterval(this.lrcInterval);
    },
    handleOnWaveformReady() {
      // 生成 peaks 数据
      const path = require("path");
      const fs = require("fs");
      const peakFile = path.resolve(
        process.cwd(),
        "cache",
        "peak_data",
        this.playingPlayListIndex + "",
        this.playingTrackIndex + ".json"
      );
      // 如果文件不存在，则生成文件
      if (!fs.existsSync(peakFile)) {
        this.wavesurfer.exportPCM(1024, 10000, true, 0).then((data: any) => {
          // 如果文件夹不存在，则创建
          const dir = path.dirname(peakFile);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          // 将 data 写入文件
          fs.writeFile(peakFile, JSON.stringify(data), (err: any) => {
            if (err) {
              console.error("保存 peek data 失败", err);
            }
          });
        });
      }

      const d = this.wavesurfer.getDuration();
      if (d) {
        this.trackDuration = wavesurferTimeFormat(d);
      }
      // audio on loaded metadata, track duration
      // 因为每次切歌后 audio 元素会被重置，所以需要每次切歌后重新绑定事件
      const a = document.querySelector("audio");
      if (a) {
        const that = this;
        a.addEventListener("loadedmetadata", function () {
          // console.log("loadedmetadata");
          that.trackDuration = wavesurferTimeFormat(
            that.wavesurfer.getDuration()
          );
        });
      }

      // // 设置专辑封面
      // const path = require("path");
      // const { exec } = require("child_process");

      // const command =
      //   '"' +
      //   path.resolve(process.cwd(), "tools", "musicTool.exe") +
      //   '" cover "' +
      //   this.track.path +
      //   '"';

      // exec(command, (_error: any, stdout: any, _stderr: any) => {
      //   if (stdout !== "") {
      //     this.coverArt = stdout;
      //   } else {
      //     this.coverArt = "./assets/album_black_48dp.svg";
      //   }
      // });

      // // 设置标题
      // document.title = this.track.title + " - " + this.track.artist;

      // // console.log(this.track);

      // // 读取歌词
      // const lrcArray = [];
      // const iconvlite = require("iconv-lite");
      // const fs = require("fs");

      // let lrcPath = this.track.path;
      // lrcPath = lrcPath.substring(0, lrcPath.lastIndexOf(".")) + ".lrc";
      // lrcPath = lrcPath.replaceAll("\\", "/");
      // // console.log(lrcPath);

      // let lrcContent = "";
      // try {
      //   const data = fs.readFileSync(lrcPath);
      //   lrcContent = iconvlite.decode(data, "gbk");
      //   // console.log(lrcContent);
      // } catch (err) {
      //   this.track.lyricsList = [{ time: "0", text: "暂无歌词" }];
      //   this.nextLrcIndex = 1;
      //   // console.error(err);
      //   return;
      // }

      // const lrc = lrcContent.split("\n");
      // for (let i = 0; i < lrc.length; i++) {
      //   let l = lrc[i];
      //   if (l.match(/^\[.*?](\r)?$/)) {
      //     continue;
      //   }

      //   let timeMatch = l.match(/\[(\d{2}):(\d{2})(\.|:)(\d{2})]/);
      //   if (timeMatch) {
      //     let min = parseInt(timeMatch[1]);
      //     let sec = parseInt(timeMatch[2]);
      //     let ms = parseInt(timeMatch[4]);
      //     const time = min * 60 + sec + ms / 1000;
      //     let text = l.replace(/\[(\d{2}):(\d{2})(\.|:)(\d{2})]/, "");
      //     lrcArray.push({
      //       time: time + "",
      //       text: text.replaceAll("\r", ""),
      //     });
      //   }
      // }
      // this.track.lyricsList = lrcArray;
      // this.nextLrcIndex = 1;
      // this.startLrcInterval();
    },
    handleOnInteraction() {
      if (!this.wavesurfer.isPlaying()) {
        this.setTrackCurrentTime();
      }
    },
    setTrackCurrentTime() {
      this.trackCurrentTime = wavesurferTimeFormat(
        this.wavesurfer.getCurrentTime()
      );
    },
    play(trackIndex: number, playingPlayListIndex: number) {
      // console.log("play");
      this.wavesurfer.cancelAjax();

      // TODO:
      const mainStore = useMainStore();
      const { playLists, showingPlayListIndex } = storeToRefs(mainStore);

      // 记录上一首歌曲
      if (this.prevTrackArray.length !== 0) {
        const latestTrack = this.prevTrackArray[this.prevTrackArray.length - 1];
        if (
          trackIndex !== latestTrack.trackIndex ||
          showingPlayListIndex.value !== latestTrack.playListIndex
        ) {
          this.prevTrackArray.push({
            trackIndex: trackIndex,
            playListIndex: showingPlayListIndex.value,
          });
        }
      } else {
        this.prevTrackArray.push({
          trackIndex: trackIndex,
          playListIndex: showingPlayListIndex.value,
        });
      }
      // console.log(this.prevTrackArray);

      this.playingPlayListIndex = playingPlayListIndex;
      this.playingTrackIndex = trackIndex;

      this.track =
        playLists.value[this.playingPlayListIndex].tracks[
          this.playingTrackIndex
        ];
      // this.wavesurfer.load(this.track.path);

      try {
        const data = getPeakData(
          this.playingPlayListIndex,
          this.playingTrackIndex
        );
        this.wavesurfer.load(this.track.path, data, "metadata");
      } catch (err) {
        this.wavesurfer.load(this.track.path);
      }
      //   this.wavesurfer.play();
      this.playPause();

      // 设置歌曲信息
      this.getAndSetTrackInfo();
    },
    playPause() {
      clearInterval(this.volumeInterval);

      // 如果是刚添加了第一个歌单，点了播放器的播放按钮，则播放第一首歌
      // TODO:
      const mainStore = useMainStore();
      const { playLists, showingPlayListIndex } = storeToRefs(mainStore);
      if (!this.track.path) {
        this.track = playLists.value[showingPlayListIndex.value].tracks[0];
        this.wavesurfer.load(this.track.path);
      }

      if (this.wavesurfer.isPlaying()) {
        this.isPlaying = false; // 立即改变按钮
        this.volumeInterval = setInterval(this.setVolumeToLower, 50);
      } else {
        this.wavesurfer.setVolume(0);
        this.wavesurfer.play();
        this.volumeInterval = setInterval(this.setVolumeToHigher, 50);
      }
    },
    setVolumeToLower() {
      if (this.wavesurfer.getVolume() > 0) {
        this.wavesurfer.setVolume(
          (this.wavesurfer.getVolume() * 10 - 0.1 * 10) / 10
        );
      } else {
        this.wavesurfer.pause();
        clearInterval(this.volumeInterval);
      }
    },
    setVolumeToHigher() {
      if (this.wavesurfer.getVolume() < this.volume / 100) {
        this.wavesurfer.setVolume(
          (this.wavesurfer.getVolume() * 10 + 0.1 * 10) / 10
        );
      } else {
        clearInterval(this.volumeInterval);
      }
    },
    playNext() {
      // TODO:
      const mainStore = useMainStore();
      const { playLists, showingPlayListIndex } = storeToRefs(mainStore);

      const tracksLength =
        playLists.value[showingPlayListIndex.value].tracks.length;

      if (this.loopMode === "shuffle") {
        this.playingTrackIndex = Math.floor(Math.random() * tracksLength);
        // this.shuffledTrackIndexArray = shuffleArray(tracksLength);
      } else {
        this.playingTrackIndex++;
        if (this.playingTrackIndex > tracksLength - 1) {
          this.playingTrackIndex = 0;
        }
      }

      this.play(this.playingTrackIndex, this.playingPlayListIndex);
    },
    playPrev() {
      // 是否需要改成：在随机播放模式下，记录上一首播放的歌曲，其他播放模式时就直接播放上一首
      this.prevTrackArray.pop();
      if (this.prevTrackArray.length >= 1) {
        const prevTrack = this.prevTrackArray.pop();
        // console.log(prevTrack);
        if (prevTrack) {
          this.playingTrackIndex = prevTrack.trackIndex;
          this.playingPlayListIndex = prevTrack.playListIndex;
          this.play(this.playingTrackIndex, this.playingPlayListIndex);
        }
      } else {
        this.play(this.playingTrackIndex, this.playingPlayListIndex);
      }
    },
    togglePlayMode() {
      if (this.loopMode === "repeat") {
        this.loopMode = "repeatOne";
      } else if (this.loopMode === "repeatOne") {
        this.loopMode = "shuffle";
      } else {
        this.loopMode = "repeat";
      }
    },
    locatePlayingTrack() {
      const index = this.playingTrackIndex < 8 ? 0 : this.playingTrackIndex - 8;
      const href = "#track-" + this.playingPlayListIndex + "-" + index;

      // TODO:
      const mainStore = useMainStore();
      const { showingPlayListIndex } = storeToRefs(mainStore);

      if (showingPlayListIndex.value !== this.playingPlayListIndex) {
        showingPlayListIndex.value = this.playingPlayListIndex;
      }
      this.lyricPageVisible = false;
      window.location.href = href;
    },

    startLrcInterval() {
      const lrcArray = this.track.lyricsList;
      if (!lrcArray || lrcArray.length <= 1) {
        return;
      }

      const _this = this;
      this.lrcInterval = setInterval(function () {
        const currentTime = _this.wavesurfer.getCurrentTime();
        const l = lrcArray[_this.nextLrcIndex];
        if (_this.nextLrcIndex === lrcArray.length) {
          return;
        }
        if (currentTime >= l.time) {
          _this.goToLyricsLine(_this.nextLrcIndex);

          _this.nextLrcIndex++;
        }
      }, 300);
    },

    seekLrc() {
      const lyricsList = this.track.lyricsList;
      if (!lyricsList || lyricsList.length <= 1) {
        return;
      }

      const currentTime = parseInt(this.wavesurfer.getCurrentTime());
      if (currentTime > parseFloat(lyricsList[lyricsList.length - 1].time)) {
        this.nextLrcIndex = lyricsList.length;
      } else {
        for (let i = 0; i < lyricsList.length; i++) {
          if (parseFloat(lyricsList[i].time) > currentTime) {
            this.nextLrcIndex = i;
            break;
          }
        }
      }

      this.goToLyricsLine(this.nextLrcIndex);
    },

    goToLyricsLine(line: number) {
      if (!this.lyricPageVisible) {
        return;
      }

      if (line >= 5) {
        line -= 5;
      } else {
        line = 0;
      }
      document.getElementById("lyrics").scrollTop =
        document.getElementById("lyric-line" + line).offsetTop +
        document.getElementById("lyric-line" + line).offsetParent.offsetTop -
        120; // 40是一行的高度，减去3行的高度
    },

    // 获取歌曲封面、歌词，设置封面、程序标题、歌词
    getAndSetTrackInfo() {
      // 设置专辑封面
      const path = require("path");
      const { exec } = require("child_process");

      const command =
        '"' +
        path.resolve(process.cwd(), "tools", "musicTool.exe") +
        '" cover "' +
        this.track.path +
        '"';

      exec(command, (_error: any, stdout: any, _stderr: any) => {
        if (stdout !== "") {
          this.coverArt = stdout;
        } else {
          this.coverArt = "./assets/album_black_48dp.svg";
        }
      });

      // 设置标题
      document.title = this.track.title + " - " + this.track.artist;

      // console.log(this.track);

      // 读取歌词
      const lrcArray = [];
      const iconvlite = require("iconv-lite");
      const fs = require("fs");

      let lrcPath = this.track.path;
      lrcPath = lrcPath.substring(0, lrcPath.lastIndexOf(".")) + ".lrc";
      lrcPath = lrcPath.replaceAll("\\", "/");
      // console.log(lrcPath);

      let lrcContent = "";
      try {
        const data = fs.readFileSync(lrcPath);
        lrcContent = iconvlite.decode(data, "gbk");
        // console.log(lrcContent);
      } catch (err) {
        this.track.lyricsList = [{ time: "0", text: "未找到歌词文件" }];
        this.nextLrcIndex = 1;
        // console.error(err);
        return;
      }

      const lrc = lrcContent.split("\n");
      // console.log(lrc);
      for (let i = 0; i < lrc.length; i++) {
        let l = lrc[i];
        if (l.match(/^\[.*?](\r)?$/)) {
          continue;
        }

        let timeMatch = l.match(/\[(\d{2}):(\d{2})(\.|:)(\d+)]/);
        if (timeMatch) {
          let min = parseInt(timeMatch[1]);
          let sec = parseInt(timeMatch[2]);
          let ms = parseInt(timeMatch[4]);
          const time = min * 60 + sec + ms / 1000;
          let text = l.replace(/\[(\d{2}):(\d{2})(\.|:)(\d+)]/, "");
          lrcArray.push({
            time: time + "",
            text: text.replaceAll("\r", ""),
          });
        }
      }
      this.track.lyricsList = lrcArray;
      // console.log(this.track.lyricsList);
      this.nextLrcIndex = 1;
      this.goToLyricsLine(0);
    },
    toggleLyricPage() {
      this.lyricPageVisible = !this.lyricPageVisible;
      // window.dispatchEvent(new Event("resize"));
      const { ipcRenderer } = require("electron");
      if (this.lyricPageVisible) {
        ipcRenderer.send("set-thumbnail-clip", "lyric");
      } else {
        ipcRenderer.send("set-thumbnail-clip");
      }
    },
  },
});

// https://github.com/katspaugh/wavesurfer.js/blob/00b9f7e4dcd04f66b5c7a3ae552aa9fb6ed588b4/example/angular-material/wavesurfer.directive.js#L97
function wavesurferTimeFormat(input: number) {
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

function shuffleArray(length: number) {
  const array = [] as number[];
  array.push(Math.floor(Math.random() * (length + 1)));
  for (let i = 1; i < length; i++) {
    const latest = array[i - 1];
    const n = Math.floor(Math.random() * (length + 1));
    if (n !== latest) {
      array.push(n);
    } else {
      i--;
    }
  }
  return array;
}

interface PrevTrack {
  trackIndex: number;
  playListIndex: number;
}
