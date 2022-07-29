import { defineStore } from "pinia";
import { Playlist } from "@/models/playlist";

export const useMainStore = defineStore("main", {
  state: () => ({
    playLists: [] as Playlist[],
    showingPlaylistIndex: 0 as number,
  }),
});
