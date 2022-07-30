import { nextTick } from "vue";
import { defineStore, storeToRefs } from "pinia";

import config from "@/config";
import PlayerSettings from "@/models/playerSettings";
import Track from "@/models/track";
import { usePlaylistStore } from "@/stores/playlist";
import { useLyricStore } from "@/stores/lyric";
import { getPeakData } from "@/utils/musicTool";

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

    coverArt: "./assets/album_black_48dp.svg" as string,
    loopMode: "repeat" as string, // repeat, repeatOne, shuffle
    prevTrackArray: [] as PrevTrack[],
    shuffledTrackIndexArray: [] as number[], // 暂时没用
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
        console.error("读取保存的播放器设置失败");
        console.error(e);
        // 加载第一个列表中的第一首歌曲，不播放
        // if (Object.values(playlists).length > 0) {
        //   this.track = playLists.value[0].tracks[0] || {};

        //   try {
        //     const data = getPeakData(this.track.id);
        //     this.wavesurfer.load(this.track.path, data, "metadata");
        //   } catch (err) {
        //     this.wavesurfer.load(this.track.path);
        //   }
        // }
      }

      // console.log("wavesurfer init complete");
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

      if (this.loopMode === "shuffle") {
        this.playingTrackIndex = Math.floor(Math.random() * length);
        // this.shuffledTrackIndexArray = shuffleArray(tracksLength);
      } else {
        this.playingTrackIndex++;
        if (this.playingTrackIndex > length - 1) {
          this.playingTrackIndex = 0;
        }
      }

      this.play(this.playingTrackIndex);
    },
    playPrev() {
      // TODO: 1.记录之前播放的歌曲索引，2.切换播放列表后清空，3.记录为空的时候播放当前索引-1的歌曲，如果当前索引为0，则播放最后一首歌曲
      // this.prevTrackArray.pop();
      // if (this.prevTrackArray.length >= 1) {
      //   const prevTrack = this.prevTrackArray.pop();
      //   // console.log(prevTrack);
      //   if (prevTrack) {
      //     this.playingTrackIndex = prevTrack.trackIndex;
      //     this.playingPlaylistIndex = prevTrack.playListIndex;
      //     this.play(this.playingTrackIndex, this.playingPlaylistIndex);
      //   }
      // } else {
      //   this.play(this.playingTrackIndex, this.playingPlaylistIndex);
      // }
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

    // 获取专辑封面、歌词，然后设置专辑封面、歌词
    getAndSetTrackInfo() {
      if (!this.track.path) return;

      // 设置专辑封面
      const { exec } = require("child_process");

      const command =
        '"' + config.MusicToolsFile + '" cover "' + this.track.path + '"';

      exec(command, (_error: any, stdout: any, _stderr: any) => {
        if (stdout !== "") {
          this.coverArt = stdout;
        } else {
          this.coverArt = "./assets/album_black_48dp.svg";
        }
      });

      // console.log(this.track);
    },
    emptyTrackInfo() {
      this.coverArt = "./assets/album_black_48dp.svg";
      this.track.title = "";
      this.track.artist = "";
    }
  },
  getters: {
    getTrack: (state) => state.track,
  }
});

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
