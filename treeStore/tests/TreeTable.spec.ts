import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

vi.mock("ag-grid-vue3", () => ({
  AgGridVue: {
    name: "AgGridVue",
    props: [
      "columnDefs",
      "rowData",
      "treeData",
      "getDataPath",
      "autoGroupColumnDef",
      "groupDefaultExpanded",
      "defaultColDef",
      "domLayout",
    ],
    template: '<div class="ag-grid-mock" />',
  },
}));

vi.mock("ag-grid-community", () => ({
  ModuleRegistry: { registerModules: vi.fn() },
  ClientSideRowModelModule: {},
}));

vi.mock("ag-grid-enterprise", () => ({
  TreeDataModule: {},
}));

import TreeTable from "@/components/TreeTable.vue";
import { items as fixtureItems } from "./fixtures";

describe("TreeTable.vue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => fixtureItems,
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("показывает спиннер, пока идёт загрузка", async () => {
    const wrapper = mount(TreeTable);
    await nextTick();

    expect(wrapper.find(".tree-table__loader").exists()).toBe(true);
    expect(wrapper.find(".ag-grid-mock").exists()).toBe(false);
  });

  it("после загрузки рендерит AgGrid и прячет спиннер", async () => {
    const wrapper = mount(TreeTable);
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();
    await nextTick();

    expect(wrapper.find(".tree-table__loader").exists()).toBe(false);
    expect(wrapper.find(".ag-grid-mock").exists()).toBe(true);
  });

  it("передаёт в AgGrid все 8 строк", async () => {
    const wrapper = mount(TreeTable);
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();
    await nextTick();

    const grid = wrapper.findComponent({ name: "AgGridVue" });
    const rowData = grid.props("rowData") as unknown[];
    expect(rowData).toHaveLength(8);
  });

  it("getDataPath возвращает путь от корня до элемента", async () => {
    const wrapper = mount(TreeTable);
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();
    await nextTick();

    const grid = wrapper.findComponent({ name: "AgGridVue" });
    const getDataPath = grid.props("getDataPath") as (item: {
      id: unknown;
    }) => string[];

    const item7 = fixtureItems.find((i) => i.id === 7)!;
    expect(getDataPath(item7)).toEqual(["1", "91064cef", "4", "7"]);

    const item1 = fixtureItems.find((i) => i.id === 1)!;
    expect(getDataPath(item1)).toEqual(["1"]);
  });

  it("показывает сообщение об ошибке при неуспешном fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
      }),
    );

    const wrapper = mount(TreeTable);
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();
    await nextTick();

    expect(wrapper.find(".tree-table__error").exists()).toBe(true);
    expect(wrapper.find(".ag-grid-mock").exists()).toBe(false);
  });
});
