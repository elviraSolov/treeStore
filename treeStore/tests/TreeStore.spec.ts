import { describe, it, expect, beforeEach } from "vitest";
import { TreeStore } from "@/core/TreeStore";
import { items } from "./fixtures";

describe("TreeStore", () => {
  let store: TreeStore;

  beforeEach(() => {
    store = new TreeStore(items);
  });

  describe("getAll", () => {
    it("возвращает все элементы", () => {
      expect(store.getAll()).toHaveLength(items.length);
    });

    it("возвращает те же объекты, что были переданы", () => {
      expect(store.getAll()[0]).toBe(items[0]);
    });

    it("возвращает пустой массив, если хранилище пустое", () => {
      expect(new TreeStore().getAll()).toEqual([]);
    });
  });

  describe("getItem", () => {
    it("находит по числовому id", () => {
      expect(store.getItem(1)?.label).toBe("Айтем 1");
    });

    it("находит по строковому id", () => {
      expect(store.getItem("91064cef")?.label).toBe("Айтем 2");
    });

    it("возвращает undefined для несуществующего id", () => {
      expect(store.getItem(999)).toBeUndefined();
    });

    it("не путает число и строку с одинаковым значением", () => {
      expect(store.getItem(3)?.label).toBe("Айтем 3");
      expect(store.getItem("3")).toBeUndefined();
    });
  });

  describe("getChildren", () => {
    it("возвращает прямых детей", () => {
      const children = store.getChildren(1);
      expect(children.map((c) => c.id)).toEqual(["91064cef", 3]);
    });

    it("возвращает пустой массив для листа", () => {
      expect(store.getChildren(7)).toEqual([]);
    });

    it("возвращает пустой массив для несуществующего id", () => {
      expect(store.getChildren(999)).toEqual([]);
    });
  });

  describe("getAllChildren", () => {
    it("возвращает всех потомков рекурсивно", () => {
      const ids = store
        .getAllChildren(1)
        .map((i) => i.id)
        .sort();
      expect(ids).toEqual([3, 4, 5, 6, 7, 8, "91064cef"].sort());
    });

    it("возвращает только поддерево указанного узла", () => {
      const ids = store
        .getAllChildren(4)
        .map((i) => i.id)
        .sort();
      expect(ids).toEqual([7, 8]);
    });

    it("возвращает пустой массив для листа", () => {
      expect(store.getAllChildren(7)).toEqual([]);
    });
  });

  describe("getAllParents", () => {
    it("возвращает путь от элемента до корня (порядок важен)", () => {
      const ids = store.getAllParents(7).map((i) => i.id);
      expect(ids).toEqual([7, 4, "91064cef", 1]);
    });

    it("для корня возвращает массив из одного элемента", () => {
      const ids = store.getAllParents(1).map((i) => i.id);
      expect(ids).toEqual([1]);
    });

    it("возвращает пустой массив для несуществующего id", () => {
      expect(store.getAllParents(999)).toEqual([]);
    });
  });

  describe("setItems", () => {
    it("полностью заменяет данные", () => {
      store.setItems([{ id: "a", parent: null, label: "A" }]);
      expect(store.getAll()).toHaveLength(1);
      expect(store.getItem(1)).toBeUndefined();
      expect(store.getItem("a")?.label).toBe("A");
    });

    it("корректно перестраивает связи после замены", () => {
      store.setItems([
        { id: 10, parent: null, label: "root" },
        { id: 11, parent: 10, label: "child" },
      ]);
      expect(store.getChildren(10).map((i) => i.id)).toEqual([11]);
      expect(store.getAllParents(11).map((i) => i.id)).toEqual([11, 10]);
    });
  });

  describe("addItem", () => {
    it("добавляет корневой элемент", () => {
      store.addItem({ id: 100, parent: null, label: "new root" });
      expect(store.getItem(100)?.label).toBe("new root");
    });

    it("добавляет дочерний элемент и связывает с родителем", () => {
      store.addItem({ id: 101, parent: 7, label: "new child" });
      expect(store.getChildren(7).map((i) => i.id)).toEqual([101]);
      expect(store.getAllParents(101).map((i) => i.id)).toEqual([
        101,
        7,
        4,
        "91064cef",
        1,
      ]);
    });

    it("не добавляет дубликат по id", () => {
      const before = store.getAll().length;
      store.addItem({ id: 1, parent: null, label: "dup" });
      expect(store.getAll()).toHaveLength(before);
      expect(store.getItem(1)?.label).toBe("Айтем 1");
    });
  });

  describe("removeItem", () => {
    it("удаляет лист", () => {
      store.removeItem(7);
      expect(store.getItem(7)).toBeUndefined();
      expect(store.getChildren(4).map((i) => i.id)).toEqual([8]);
    });

    it("удаляет элемент вместе со всем поддеревом", () => {
      store.removeItem("91064cef");
      expect(store.getItem("91064cef")).toBeUndefined();
      expect(store.getItem(4)).toBeUndefined();
      expect(store.getItem(5)).toBeUndefined();
      expect(store.getItem(6)).toBeUndefined();
      expect(store.getItem(7)).toBeUndefined();
      expect(store.getItem(8)).toBeUndefined();
      // корень и его второй ребёнок остаются
      expect(store.getItem(1)).toBeDefined();
      expect(store.getItem(3)).toBeDefined();
      expect(store.getChildren(1).map((i) => i.id)).toEqual([3]);
    });

    it("удаляет корень вместе со всем деревом", () => {
      const isolated = new TreeStore(items);
      isolated.removeItem(1);
      expect(isolated.getAll()).toEqual([]);
    });

    it("молча игнорирует несуществующий id", () => {
      const before = store.getAll().length;
      store.removeItem(999);
      expect(store.getAll()).toHaveLength(before);
    });
  });

  describe("updateItem", () => {
    it("обновляет произвольные поля", () => {
      store.updateItem({ id: 7, parent: 4, label: "Обновлённый" });
      expect(store.getItem(7)?.label).toBe("Обновлённый");
    });

    it("переносит элемент к новому родителю", () => {
      store.updateItem({ id: 7, parent: 1, label: "Айтем 7" });
      expect(store.getChildren(4).map((i) => i.id)).toEqual([8]);
      expect(store.getChildren(1).map((i) => i.id)).toEqual(["91064cef", 3, 7]);
    });

    it("делает элемент корневым при parent = null", () => {
      store.updateItem({ id: 7, parent: null, label: "Айтем 7" });
      expect(store.getAllParents(7).map((i) => i.id)).toEqual([7]);
    });

    it("добавляет элемент, если его не было", () => {
      store.updateItem({ id: 500, parent: null, label: "новый" });
      expect(store.getItem(500)?.label).toBe("новый");
    });
  });
});
