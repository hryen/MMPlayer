import { defineStore } from "pinia";
import { Playlist } from "@/models/playlist";
import config from "@/config";
import Track from "@/models/track";

export const usePlaylistStore = defineStore("playlist", {
  state: () => ({
    playlists: {} as { [key: string]: Playlist },
    showingPlaylistId: "" as string,
  }),
  getters: {
    getPlaylists: (state) => state.playlists,
    getShowingPlaylistId: (state) => state.showingPlaylistId,
  },
  actions: {
    async init() {
      try {
        const playlists = await this.findPlaylists();
        for (const playlist of playlists) {
          this.playlists[playlist.id] = playlist;
        }
        // console.log("playlist init complete");
      } catch (e) {
        console.error("playlist init error:", e);
      }
    },
    async findPlaylists(): Promise<Playlist[]> {
      //   console.log("findPlaylists");
      const _this = this;
      const playlists = [] as Playlist[];

      const sqlJs = require("sql.js");
      await sqlJs().then(async function (SQL: any) {
        const db = getDB(SQL);
        const stmt = db.prepare("SELECT * FROM playlist");
        while (stmt.step()) {
          const playlist: Playlist = stmt.getAsObject() as Playlist;
          const tracks = await _this.findTracksByPlaylistId(playlist.id);
          playlist.tracks = tracks;
          // console.log(playlist);
          playlists.push(playlist);
        }
        db.close();
      });
      //   console.log(playlists);
      return Promise.resolve(playlists);
    },
    async findTracksByPlaylistId(playlistId: string): Promise<Track[]> {
      //   console.log("findTracksByPlaylistId");
      //   const start = new Date().getTime();
      const tracks = [] as Track[];

      const sqlJs = require("sql.js");
      await sqlJs().then(function (SQL: any) {
        const db = getDB(SQL);
        const stmt = db.prepare("SELECT * FROM track WHERE playlist_id=$id");
        stmt.bind({ $id: playlistId });
        while (stmt.step()) {
          const track: Track = stmt.getAsObject() as Track;
          //   console.log(track);
          tracks.push(track);
        }
        db.close();
      });
      //   console.log(tracks);
      //   console.log("findTracksByPlaylistId:", new Date().getTime() - start, "ms");
      return Promise.resolve(tracks);
    },
  },
});

function getDB(SQL: any) {
  const fs = require("fs");
  const filebuffer = fs.readFileSync(config.DatabaseFile);
  return new SQL.Database(filebuffer);
}
