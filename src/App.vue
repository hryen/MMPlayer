<script setup lang="ts">
import Layout from "@/components/Layout.vue";
import "@/init";
</script>

<template>
  <Layout />
</template>

<style>
@import "normalize.css/normalize.css";

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  user-select: none;
}

#app {
  position: fixed;
  top: 6px;
  left: 6px;
  width: calc(100% - 12px);
  height: calc(100% - 12px);
  box-shadow: 0 0 6px rgb(0 0 0 / 20%);
  border-radius: 8px;
}

img {
  -webkit-user-drag: none;
}
</style>
