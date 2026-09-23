import { describe, it, expect } from "vitest";
import { TreeStore } from "@/core/TreeStore";
import type { Item } from "@/types/item";

/**
 * Генерируем большое дерево:
 *  - N_TOP корней
 *  - у каждого — ветка глубины DEPTH, по BRANCH детей на уровень
 *  - id — уникальные строки, parent — id родителя
 */
function generateLargeTree(
  nTop: number,
  depth: number,
  branch: number,
): Item[] {
  const items: Item[] = [];
  let counter = 0;

  const build = (parentId: string | null, level: number) => {
    if (level > depth) return;
    const count = level === 0 ? nTop : branch;
    for (let i = 0; i < count; i++) {
      const id = `id-${counter++}`;
      items.push({ id, parent: parentId, label: `item ${id}` });
      build(id, level + 1);
    }
  };

  build(null, 0);
  return items;
}

describe("TreeStore — производительность", () => {
  const DEPTH = 4;
  const BRANCH = 10;
  const N_TOP = 10;
  const items = generateLargeTree(N_TOP, DEPTH, BRANCH);
  // ~111 110 элементов

  it("setItems укладывается в разумное время", () => {
    const t0 = performance.now();
    const store = new TreeStore(items);
    const t1 = performance.now();
    expect(store.getAll()).toHaveLength(items.length);
    expect(t1 - t0).toBeLessThan(500);
  });

  it("getItem — O(1) на большом массиве", () => {
    const store = new TreeStore(items);
    const target = items[items.length - 1].id;
    const t0 = performance.now();
    for (let i = 0; i < 100_000; i++) {
      store.getItem(target);
    }
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(200);
  });

  it("getAllParents проходит глубину быстро", () => {
    const store = new TreeStore(items);
    const deepest = items[items.length - 1].id;
    const t0 = performance.now();
    for (let i = 0; i < 10_000; i++) {
      store.getAllParents(deepest);
    }
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(300);
  });

  it("removeItem поддерева не деградирует", () => {
    const store = new TreeStore(items);
    const t0 = performance.now();
    store.removeItem("id-0");
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(500);
  });
});
