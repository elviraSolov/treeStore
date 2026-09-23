<template>
  <div class="app">
    <TreeTable />
  </div>
</template>

<script setup lang="ts">
import TreeTable from "@/components/TreeTable.vue";
</script>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  background: #f5f5f5;
}

.app {
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
  box-sizing: border-box;
}
</style>
