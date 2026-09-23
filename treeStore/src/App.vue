<script setup lang="ts">
import { onMounted } from "vue";
import { useItemsLoader } from "@/composables/useItemsLoader";

const { items, loading, error, load } = useItemsLoader();

onMounted(load);
</script>

<template>
  <div>
    <p v-if="loading">Загрузка…</p>
    <p v-else-if="error">Ошибка загрузки: {{ error }}</p>
    <ul v-else>
      <li v-for="item in items" :key="item.id">
        {{ item.id }} — {{ item.label }} (parent: {{ item.parent ?? "—" }})
      </li>
    </ul>
  </div>
</template>
