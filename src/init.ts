import { useMainStore } from "@/stores/main";
import { usePlayerStore } from "@/stores/player";
import { storeToRefs } from "pinia";

import config from "@/config";
import PlayList from "@/models/playlist";
import Track from "@/models/track";

const { ipcRenderer } = require("electron");
ipcRenderer.on("rendered", async (_event: any, _arg: any) => {
  const start = new Date().getTime();
  await initPlaylists();
  usePlayerStore().init();
  console.log("初始化完成, 用时", new Date().getTime() - start, "ms");
});

async function initPlaylists() {
  const playlists = [] as PlayList[];
  // find all playlists and tracks from db
  const fs = require("fs");
  const filebuffer = fs.readFileSync(config.DatabaseFile);
  const initSqlJs = require("sql.js");
  await initSqlJs().then(function (SQL: any) {
    // load the db
    const db = new SQL.Database(filebuffer);

    // find all the playlists
    const playlistStmt = db.prepare("SELECT * FROM playlist");
    while (playlistStmt.step()) {
      const obj = playlistStmt.getAsObject();
      const playlist: PlayList = {
        id: obj.id,
        name: obj.name,
        path: obj.path,
        tracks: [],
      };
      // console.log(playlist);

      // find all the tracks
      const tracks = [];
      const trackStmt = db.prepare("SELECT * FROM track WHERE playlist_id=$id");
      trackStmt.bind({ $id: playlist.id });
      while (trackStmt.step()) {
        const obj = trackStmt.getAsObject();
        const track: Track = {
          id: obj.id,
          title: obj.title,
          artist: obj.artist,
          album: obj.album,
          path: obj.path,
          liked: obj.liked,
          lyrics: [],
        };
        // console.log(track);
        tracks.push(track);
      }
      trackStmt.free();

      playlist.tracks = tracks;
      playlists.push(playlist);
    }
    playlistStmt.free();
    db.close();

    const mainStore = useMainStore();
    const { playLists } = storeToRefs(mainStore);
    playLists.value = playlists;
  });
}
