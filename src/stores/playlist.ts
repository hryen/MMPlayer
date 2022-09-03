import { defineStore } from "pinia";
import { Playlist } from "@/models/playlist";
import { config } from "@/config";
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
      const _playlists = {} as { [key: string]: Playlist };
      try {
        const playlists = await this.findPlaylists();
        for (const playlist of playlists) {
          _playlists[playlist.id] = playlist;
        }
        // console.log("playlist init complete");
      } catch (e) {
        console.error("playlist init error:", e);
      }
      this.playlists = _playlists;
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
    async deletePlaylistById(playlistId: string) {
      // console.log("deletePlaylistById", playlistId);
      const sqlJs = require("sql.js");
      try {
        await sqlJs().then(function (SQL: any) {
          const db = getDB(SQL);

          db.exec("BEGIN;");

          db.exec("DELETE FROM playlist WHERE id=$id;", {
            $id: playlistId,
          });

          db.exec("DELETE FROM track WHERE playlist_id=$id;", {
            $id: playlistId,
          });

          db.exec("COMMIT;");

          const data = db.export();
          db.close();

          writeDB(data);
        });
      } catch (e) {
        console.log("deletePlaylistById error:", e);
      }
    },
  },
});

function getDB(SQL: any) {
  const fs = require("fs");
  const filebuffer = fs.readFileSync(config.DatabaseFile);
  return new SQL.Database(filebuffer);
}

function writeDB(data: any) {
  const buffer = Buffer.from(data);
  const fs = require("fs");
  fs.writeFileSync(config.DatabaseFile, buffer);
}
