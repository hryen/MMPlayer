<script setup lang="ts">
import Header from "@/components/Header.vue";
import Playlist from "@/components/Playlist.vue";
import TrackList from "@/components/TrackList.vue";
import Player from "@/components/Player.vue";
import Lyric from "@/components/Lyric.vue";
</script>

<template>
  <Header />

  <div id="main">
    <Playlist />
    <TrackList />
    <Lyric />
  </div>

  <Player />
</template>
