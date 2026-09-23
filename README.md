# MStroy — TreeStore + AgGrid

Тестовое задание Frontend / Vue.js: хранилище-дерево `TreeStore` и таблица на AgGrid Enterprise с Tree Data.

## Стек

- Vue 3 (`<script setup>`) + TypeScript
- Vite
- AgGrid Enterprise (`ag-grid-community`, `ag-grid-enterprise`, `ag-grid-vue3`)
- Vitest + `@vue/test-utils` + jsdom

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:5173
```

Прод-сборка и предпросмотр:

```bash
npm run build
npm run preview
```

## Тесты

```bash
npm run test           # один прогон
npm run test:watch     # watch-режим
npm run test:coverage  # покрытие
```

## Структура

```
public/items.json              # данные, грузятся через fetch (задержка 2 сек)
src/
  core/TreeStore.ts            # класс-хранилище
  composables/useItemsLoader.ts
  components/TreeTable.vue     # AgGrid + Tree Data
  types/item.ts
  App.vue
tests/                         # unit- и перф-тесты
```

## TreeStore

Хранит элементы `{ id, parent, label }` в трёх структурах: плоский `items`, `Map<id, entry>` для O(1)-доступа и `childrenIds` у каждой записи.

| Метод                | Сложность   |
| -------------------- | ----------- |
| `getAll()`           | O(1)        |
| `getItem(id)`        | O(1)        |
| `getChildren(id)`    | O(k)        |
| `getAllChildren(id)` | O(m)        |
| `getAllParents(id)`  | O(d)        |
| `setItems(items)`    | O(n)        |
| `addItem(item)`      | O(1)        |
| `removeItem(id)`     | O(n + m)    |
| `updateItem(item)`   | O(1) / O(k) |

`id` — число или строка, сравнение строгое.

## Загрузка данных

`useItemsLoader` делает `fetch('/items.json')` параллельно с `setTimeout(2000)`, поэтому задержка ровно 2 секунды. Результат кладётся в `shallowRef`, `TreeTable` подписан через `watch` и вызывает `store.setItems(...)`.

## Скрипты

| Команда         | Действие                         |
| --------------- | -------------------------------- |
| `dev`           | dev-сервер Vite                  |
| `build`         | `vue-tsc --noEmit && vite build` |
| `preview`       | предпросмотр `dist/`             |
| `test`          | Vitest, один прогон              |
| `test:watch`    | Vitest в watch-режиме            |
| `test:coverage` | Vitest + покрытие                |
