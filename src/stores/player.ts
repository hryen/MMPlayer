import { nextTick } from "vue";
import { defineStore, storeToRefs } from "pinia";

import config from "@/config";
import PlayerSettings from "@/models/playerSettings";
import Track from "@/models/track";
import { usePlaylistStore } from "@/stores/playlist";
import { useLyricStore } from "@/stores/lyric";
import { getPeakData, exportImage } from "@/utils/musicTool";

export const usePlayerStore = defineStore("player", {
  state: () => ({
    wavesurfer: null as any,
    volume: 80 as number,
    volumeInterval: null as any,
    isPlaying: false as boolean,

    playingPlaylistId: "" as string,
    playingTrackIndex: 0 as number,

    track: {} as Track, // 待改名 track -> playingTrack
    trackDuration: 0 as number,

    trackCurrentTime: 0 as number,
    trackCurrentTimeInterval: null as any,

    trackCoverImage: config.defaultCoverImage as string,
    loopMode: "repeat" as string, // repeat, repeatOne, shuffle

    shuffledTrackIndexArray: [] as number[],
    shuffledPlayingTrackIndex: 0 as number,
  }),
  actions: {
    init() {
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
      this.wavesurfer.on("error", this.handleOnError);
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
        const fs = require("fs");
        const playerSetting: PlayerSettings = JSON.parse(
          fs.readFileSync(config.PlayerSettingsFile)
        );

        this.loopMode = playerSetting.loopMode;
        const playlists = usePlaylistStore().getPlaylists;
        if (Object.values(playlists).length > 0) {
          this.playingPlaylistId = playerSetting.playingPlaylistId;
          this.playingTrackIndex = playerSetting.playingTrackIndex;
          this.track =
            playlists[this.playingPlaylistId].tracks[this.playingTrackIndex];

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
      } catch (e: any) {
        console.error("读取保存的播放器设置失败:", e);
      }

      // console.log("wavesurfer init complete");
    },
    handleOnError(msg: Error) {
      if (msg.message === "Failed to fetch") {
        const { ipcRenderer } = require("electron");
        ipcRenderer.send("dialogErrorMessage", ["播放错误", "加载音频文件失败"]);
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

      // this.startLrcInterval();
      useLyricStore().startLyricInterval();
    },
    handleOnPause() {
      this.isPlaying = false;
      const { ipcRenderer } = require("electron");
      ipcRenderer.send("changePlayStatus", this.isPlaying);
      clearInterval(this.trackCurrentTimeInterval);
      useLyricStore().clearLyricInterval();
    },
    handleOnSeek() {
      this.setTrackCurrentTime();
      // this.seekLrc();
      useLyricStore().seekLyric();
    },
    handleOnFinish() {
      if (this.loopMode === "repeatOne") {
        this.playPause();
        useLyricStore().resetLyricIndex();
      } else {
        // this.playNext();
        const _this = this;
        setTimeout(function () {
          useLyricStore().clearLyricInterval();
          _this.playNext();
        }, 1000);
      }
    },
    handleOnDestroy() {
      clearInterval(this.trackCurrentTimeInterval);
      useLyricStore().clearLyricInterval();
    },
    handleOnWaveformReady() {
      // 设置标题
      document.title = this.track.title + " - " + this.track.artist;

      // 生成 peaks 数据
      const path = require("path");
      const fs = require("fs");
      const peakFile = path.resolve(
        process.cwd(),
        "cache",
        "peak_data",
        this.track.id + ".json"
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
        this.trackDuration = d;
      }
      // audio on loaded metadata, track duration
      // 因为每次切歌后 audio 元素会被重置，所以需要每次切歌后重新绑定事件
      const a = document.querySelector("audio");
      if (a) {
        const that = this;
        a.addEventListener("loadedmetadata", function () {
          that.trackDuration = that.wavesurfer.getDuration();
        });
      }
    },
    handleOnInteraction() {
      if (!this.wavesurfer.isPlaying()) {
        this.setTrackCurrentTime();
      }
    },
    setTrackCurrentTime() {
      this.trackCurrentTime = this.wavesurfer.getCurrentTime();
    },
    play(trackIndex: number) {
      // console.log("play");
      this.wavesurfer.cancelAjax();

      const playlists = usePlaylistStore().getPlaylists;

      this.playingTrackIndex = trackIndex;
      this.track = playlists[this.playingPlaylistId].tracks[trackIndex];

      try {
        const data = getPeakData(this.track.id);
        this.wavesurfer.load(this.track.path, data, "metadata");
      } catch (err) {
        this.wavesurfer.load(this.track.path);
      }

      this.playPause();
    },
    playWithPlaylistId(trackIndex: number) {
      const showingPlaylistId = usePlaylistStore().getShowingPlaylistId;
      this.playingPlaylistId = showingPlaylistId;
      this.play(trackIndex);
    },
    playPause() {
      clearInterval(this.volumeInterval);

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
      const playlists = usePlaylistStore().getPlaylists;

      const length = playlists[this.playingPlaylistId].tracks.length;
      let nextTrackIndex = this.playingTrackIndex + 1;
      if (nextTrackIndex > length - 1) {
        nextTrackIndex = 0;
      }

      if (this.loopMode === "shuffle") {
        this.shuffledPlayingTrackIndex++;
        if (
          this.shuffledPlayingTrackIndex >
          this.shuffledTrackIndexArray.length - 1
        ) {
          this.shuffledPlayingTrackIndex = 0;
        }
        nextTrackIndex =
          this.shuffledTrackIndexArray[this.shuffledPlayingTrackIndex];
      }

      this.play(nextTrackIndex);
    },
    playPrev() {
      const playlists = usePlaylistStore().getPlaylists;

      const length = playlists[this.playingPlaylistId].tracks.length;
      let nextTrackIndex = this.playingTrackIndex - 1;
      if (nextTrackIndex < 0) {
        nextTrackIndex = length - 1;
      }

      if (this.loopMode === "shuffle") {
        this.shuffledPlayingTrackIndex--;
        if (this.shuffledPlayingTrackIndex < 0) {
          this.shuffledPlayingTrackIndex =
            this.shuffledTrackIndexArray.length - 1;
        }
        nextTrackIndex =
          this.shuffledTrackIndexArray[this.shuffledPlayingTrackIndex];
      }

      this.play(nextTrackIndex);
    },
    togglePlayMode() {
      if (this.loopMode === "repeat") {
        this.loopMode = "repeatOne";
      } else if (this.loopMode === "repeatOne") {
        this.loopMode = "shuffle";
        this.shufflePlayingPlaylistArray();
        this.shuffledPlayingTrackIndex = 0;
      } else {
        this.loopMode = "repeat";
      }
    },
    locatePlayingTrack() {
      useLyricStore().closeLyricPage();

      const { showingPlaylistId } = storeToRefs(usePlaylistStore());
      showingPlaylistId.value = this.playingPlaylistId;

      nextTick(() => {
        const tracklement = document.getElementById(
          "track-" + this.playingTrackIndex
        );
        if (tracklement) {
          tracklement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      });
    },

    emptyTrackInfo() {
      this.trackCoverImage = config.defaultCoverImage;
      this.track = {} as Track;
    },
    handleImageError(e: any) {
      e.target.src = config.defaultCoverImage;
      exportImage(this.track.path, this.trackCoverImage).then(() => {
        e.target.src = this.trackCoverImage;
      });
    },
    shufflePlayingPlaylistArray() {
      const playlists = usePlaylistStore().getPlaylists;
      const length = playlists[this.playingPlaylistId].tracks.length - 1;

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
      this.shuffledTrackIndexArray = array;
      // console.log(this.shuffledTrackIndexArray);
    },
  },
  getters: {
    getTrack: (state) => state.track,
  },
});
