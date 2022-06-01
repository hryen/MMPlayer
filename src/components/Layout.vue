<script setup lang="ts">
import Header from "@/components/Header.vue";
import PlayList from "@/components/PlayList.vue";
import TrackList from "@/components/TrackList.vue";
import Player from "@/components/Player.vue";
import Lyrics from "@/components/Lyrics.vue";
</script>

<template>
  <Header />

  <div id="main">
    <PlayList />
    <TrackList />
    <Lyrics />
  </div>

  <Player />
</template>
