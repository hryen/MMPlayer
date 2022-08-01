<!-- https://arco.design/react/components/spin -->
<template>
  <div class="arco-spin arco-spin-loading" v-show="props.loading">
    <div class="arco-spin-children"></div>
    <div class="arco-spin-loading-layer">
      <span class="arco-spin-loading-layer-inner"
        ><span class="arco-spin-icon"
          ><svg
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
            class="arco-icon arco-icon-loading"
          >
            <path
              d="M42 24c0 9.941-8.059 18-18 18S6 33.941 6 24 14.059 6 24 6"
            ></path></svg
        ></span>
        <div class="arco-spin-tip">{{ props.tip }}</div></span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps(["loading", "tip"]);
</script>

<style scoped>
.arco-spin {
  display: inline-block;

  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;

  user-select: none;
}
.arco-spin-loading .arco-spin-children:after {
  opacity: 1;
  pointer-events: auto;
}
.arco-spin-children:after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  opacity: 0;
  transition: opacity 0.1s linear;
  pointer-events: none;
  z-index: 1;
}
.arco-spin-loading-layer {
  text-align: center;
}
.arco-spin-loading .arco-spin-loading-layer-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.arco-spin-icon {
  color: rgb(22, 93, 255);
  font-size: 20px;
}
.arco-spin-tip {
  margin-top: 6px;
  color: rgb(22, 93, 255);
  font-weight: 500;
  font-size: 14px;
}

.arco-icon[stroke="currentColor"] {
  stroke: currentColor;
  fill: none;
}

.arco-icon-loading {
  animation: arco-loading-circle 1s linear infinite;
}
@keyframes arco-loading-circle {
  to {
    transform: rotate(1turn);
  }
}

.arco-icon {
  display: inline-block;
  color: inherit;
  font-style: normal;
  width: 1em;
  height: 1em;
  vertical-align: -2px;
  stroke: currentColor;
}
</style>
