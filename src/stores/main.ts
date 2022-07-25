import { defineStore } from "pinia";
import { PlayList } from "@/models/playlist";

export const useMainStore = defineStore("main", {
  state: () => ({
    playLists: [] as PlayList[],
    showingPlayListIndex: 0 as number,
  }),
});
