<template>
  <div class="tree-table">
    <div
      v-if="loading"
      class="tree-table__loader"
      role="status"
      aria-live="polite"
    >
      <span class="spinner" aria-hidden="true" />
      <span>Загрузка данных…</span>
    </div>

    <p v-else-if="error" class="tree-table__error">Ошибка загрузки данных</p>

    <ag-grid-vue
      v-else
      class="ag-theme-quartz tree-table__grid"
      :column-defs="columnDefs"
      :row-data="rowData"
      :tree-data="true"
      :get-data-path="getDataPath"
      :auto-group-column-def="autoGroupColumnDef"
      :group-default-expanded="-1"
      :default-col-def="{ resizable: true, sortable: false }"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type GetDataPath,
  type ValueGetterParams,
} from "ag-grid-community";
import { TreeDataModule } from "ag-grid-enterprise";

import { TreeStore } from "@/core/TreeStore";
import { useItemsLoader } from "@/composables/useItemsLoader";
import type { Item, ItemId } from "@/types/item";

ModuleRegistry.registerModules([ClientSideRowModelModule, TreeDataModule]);

const store = new TreeStore();
const { items, loading, error, load } = useItemsLoader();

const rowData = shallowRef<Item[]>([]);
const pathMap = shallowRef<Map<ItemId, string[]>>(new Map());

function buildPathMap(all: Item[]): Map<ItemId, string[]> {
  const byId = new Map<ItemId, Item>();
  for (let i = 0; i < all.length; i++) byId.set(all[i].id, all[i]);

  const map = new Map<ItemId, string[]>();
  const inProgress = new Set<ItemId>();

  const build = (item: Item): string[] => {
    const cached = map.get(item.id);
    if (cached) return cached;
    if (inProgress.has(item.id)) return [String(item.id)];
    inProgress.add(item.id);

    let path: string[];
    if (item.parent === null) {
      path = [String(item.id)];
    } else {
      const parent = byId.get(item.parent);
      path = parent ? [...build(parent), String(item.id)] : [String(item.id)];
    }

    inProgress.delete(item.id);
    map.set(item.id, path);
    return path;
  };

  for (let i = 0; i < all.length; i++) build(all[i]);
  return map;
}

function rebuild(): void {
  const all = store.getAll();
  const map = buildPathMap(all);
  pathMap.value = map;
  rowData.value = all;
}

const columnDefs = computed<ColDef<Item>[]>(() => [
  {
    headerName: "№ п/п",
    colId: "rowNumber",
    valueGetter: (p: ValueGetterParams<Item>) =>
      p.node ? p.node.rowIndex! + 1 : "",
    width: 90,
    minWidth: 70,
    maxWidth: 110,
    suppressSizeToFit: true,
    cellStyle: { textAlign: "left" },
  },
  {
    headerName: "Категория",
    colId: "category",
    showRowGroup: true,
    cellRenderer: "agGroupCellRenderer",
    cellRendererParams: { suppressCount: true },
    valueGetter: (p: ValueGetterParams<Item>) => {
      const id = p.data?.id;
      if (id === undefined) return "";
      return store.getChildren(id).length > 0 ? "Группа" : "Элемент";
    },
    minWidth: 220,
    flex: 1,
    cellStyle: { textAlign: "left" },
  },
  {
    headerName: "Наименование",
    colId: "label",
    field: "label",
    flex: 1,
    minWidth: 200,
    cellStyle: { textAlign: "left" },
  },
]);

const autoGroupColumnDef: ColDef<Item> = {
  headerName: "",
  width: 0,
  minWidth: 0,
  maxWidth: 0,
  suppressSizeToFit: true,
  cellRenderer: () => "",
  cellRendererParams: { suppressCount: true },
};

const getDataPath: GetDataPath = (data: Item) => {
  const fromMap = pathMap.value.get(data.id);
  if (fromMap) return fromMap;

  const path: string[] = [String(data.id)];
  let current: Item | undefined = data;
  const guard = new Set<ItemId>();
  while (current && current.parent !== null && !guard.has(current.id)) {
    guard.add(current.id);
    const parent = store.getItem(current.parent);
    if (!parent) break;
    path.unshift(String(parent.id));
    current = parent;
  }
  return path;
};

const gridApi = shallowRef<GridApi<Item> | null>(null);
function onGridReady(params: GridReadyEvent<Item>) {
  gridApi.value = params.api;
  params.api.sizeColumnsToFit();
}

watch(items, (next) => {
  if (next.length > 0) {
    store.setItems(next);
    rebuild();
  }
});

onMounted(load);
</script>

<style scoped>
.tree-table {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;

  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-table__grid {
  flex: 1;
  min-height: auto;
  max-height: auto;
  height: auto;
}

.tree-table__loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  font-size: 16px;
  color: #444;
  flex: 1;
}

.tree-table__error {
  padding: 24px;
  color: #c62828;
  text-align: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #c5c5c5;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

:deep(.ag-cell) {
  justify-content: flex-start;
  text-align: left;
}

.app {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
