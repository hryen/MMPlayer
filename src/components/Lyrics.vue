<script setup lang="ts"></script>
<template>
  <div id="player-lyrics-container">
    <div id="player-lyrics">
      <div id="player-lyrics__prev">1</div>
      <div id="player-lyrics__curr">暂无歌词</div>
      <div id="player-lyrics__next">2</div>
    </div>
  </div>
</template>
<style>
#player-lyrics-container {
  width: calc(100% - 220px);
  height: 128px;
  border-bottom: 1px solid #f7f8fa;
  border-radius: 16px 16px 0 0;
  box-shadow: 0px -6px 10px -8px rgb(0 0 0 / 20%);
  background-color: #ffffff;
  position: absolute;
  bottom: 72px;
  left: 220px;
  padding: 20px;
}
#player-lyrics {
  height: 100%;
  padding: 0 20%;
  display: flex;
  flex-flow: column;
  justify-content: space-between;
}
#player-lyrics__prev,
#player-lyrics__curr,
#player-lyrics__next {
  width: 100%;
  font-size: 14px;
  line-height: 161.8%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
  text-align: center;
}
#player-lyrics__curr {
  font-weight: bold;
  font-size: 16px;
}
</style>
