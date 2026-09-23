import type { Item, ItemId, TreeStoreEntry } from "@/types/item";

export class TreeStore {
  /** Плоский список всех элементов (в порядке добавления) */
  private items: Item[] = [];

  /** Индекс: id -> запись с элементом и массивом id его детей */
  private map = new Map<ItemId, TreeStoreEntry>();

  /** Кэш id корневых элементов (parent === null) */
  private rootIds: ItemId[] = [];

  constructor(initialItems: Item[] = []) {
    if (initialItems.length > 0) {
      this.setItems(initialItems);
    }
  }

  /** Возвращает полный массив элементов */
  getAll(): Item[] {
    return this.items;
  }

  /** Возвращает элемент по id или undefined */
  getItem(id: ItemId): Item | undefined {
    return this.map.get(id)?.item;
  }

  /** Прямые дети указанного элемента */
  getChildren(id: ItemId): Item[] {
    const entry = this.map.get(id);
    if (!entry) return [];
    const ids = entry.childrenIds;
    const result: Item[] = new Array(ids.length);
    for (let i = 0; i < ids.length; i++) {
      result[i] = this.map.get(ids[i])!.item;
    }
    return result;
  }

  /** Все потомки (рекурсивно, в порядке обхода в глубину) */
  getAllChildren(id: ItemId): Item[] {
    const entry = this.map.get(id);
    if (!entry) return [];

    const result: Item[] = [];
    const stack: ItemId[] = [...entry.childrenIds];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      const current = this.map.get(currentId);
      if (!current) continue;

      result.push(current.item);
      const childIds = current.childrenIds;
      for (let i = childIds.length - 1; i >= 0; i--) {
        stack.push(childIds[i]);
      }
    }
    return result;
  }

  /**
   * Цепочка родителей от самого элемента до корня
   */
  getAllParents(id: ItemId): Item[] {
    const start = this.map.get(id);
    if (!start) return [];

    const result: Item[] = [start.item];
    let current: Item | undefined = start.item;

    while (current && current.parent !== null) {
      const parentEntry = this.map.get(current.parent);
      if (!parentEntry) break;
      result.push(parentEntry.item);
      current = parentEntry.item;
    }
    return result;
  }

  /** Полностью заменяет данные хранилища */
  setItems(items: Item[]): void {
    this.items = items.slice();
    this.map = new Map();
    this.rootIds = [];

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      this.map.set(item.id, { item, childrenIds: [] });
    }

    // Второй проход: связываем детей с родителями
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.parent === null) {
        this.rootIds.push(item.id);
      } else {
        const parentEntry = this.map.get(item.parent);
        if (parentEntry) {
          parentEntry.childrenIds.push(item.id);
        }
        // Если родителя нет — элемент становится "висячим",
        // но остаётся доступным через getItem
      }
    }
  }

  /** Добавляет новый элемент в хранилище */
  addItem(item: Item): void {
    if (this.map.has(item.id)) {
      return;
    }
    this.items.push(item);
    this.map.set(item.id, { item, childrenIds: [] });

    if (item.parent === null) {
      this.rootIds.push(item.id);
    } else {
      const parentEntry = this.map.get(item.parent);
      if (parentEntry) {
        parentEntry.childrenIds.push(item.id);
      }
    }
  }

  /** Удаляет элемент и всё его поддерево */
  removeItem(id: ItemId): void {
    const entry = this.map.get(id);
    if (!entry) return;

    // 1. Собираем id всего поддерева
    const toRemove = new Set<ItemId>();
    const stack: ItemId[] = [id];
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (toRemove.has(currentId)) continue;
      toRemove.add(currentId);
      const currentEntry = this.map.get(currentId);
      if (currentEntry) {
        const childIds = currentEntry.childrenIds;
        for (let i = 0; i < childIds.length; i++) {
          stack.push(childIds[i]);
        }
      }
    }

    // 2. Отвязываем удаляемый корень от родителя
    if (entry.item.parent !== null) {
      const parentEntry = this.map.get(entry.item.parent);
      if (parentEntry) {
        const idx = parentEntry.childrenIds.indexOf(id);
        if (idx !== -1) parentEntry.childrenIds.splice(idx, 1);
      }
    } else {
      const idx = this.rootIds.indexOf(id);
      if (idx !== -1) this.rootIds.splice(idx, 1);
    }

    // 3. Удаляем из map и items
    this.map.delete(id);
    for (const removeId of toRemove) {
      this.map.delete(removeId);
    }

    // Перестраиваем плоский массив: фильтруем items, исключая удалённые id
    // (один проход O(n), неизбежен, т.к. getAll() должен вернуть новый массив)
    this.items = this.items.filter((it) => !toRemove.has(it.id));
  }

  /** Обновляет существующий элемен */
  updateItem(item: Item): void {
    const entry = this.map.get(item.id);
    if (!entry) {
      // обновление несуществующего элемента — добавляем как новый
      this.addItem(item);
      return;
    }

    const oldItem = entry.item;
    const oldParent = oldItem.parent;
    const newParent = item.parent;

    // Обновляем сам объект (сохраняя ту же ссылку в map и items)
    Object.assign(oldItem, item);
    entry.item = oldItem;

    // Если родитель не изменился — больше ничего делать не нужно
    if (oldParent === newParent) return;

    // Отвязываем от старого родителя
    if (oldParent !== null) {
      const oldParentEntry = this.map.get(oldParent);
      if (oldParentEntry) {
        const idx = oldParentEntry.childrenIds.indexOf(item.id);
        if (idx !== -1) oldParentEntry.childrenIds.splice(idx, 1);
      }
    } else {
      const idx = this.rootIds.indexOf(item.id);
      if (idx !== -1) this.rootIds.splice(idx, 1);
    }

    // Привязываем к новому родителю
    if (newParent === null) {
      this.rootIds.push(item.id);
    } else {
      const newParentEntry = this.map.get(newParent);
      if (newParentEntry) {
        newParentEntry.childrenIds.push(item.id);
      }
    }
  }
}
