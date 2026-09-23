// tests/useItemsLoader.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useItemsLoader, LOAD_DELAY_MS } from "@/composables/useItemsLoader";
import { items as fixtureItems } from "./fixtures";

describe("useItemsLoader", () => {
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
  });

  it("начинает с пустого массива и loading=false", () => {
    const { items, loading } = useItemsLoader();
    expect(items.value).toEqual([]);
    expect(loading.value).toBe(false);
  });

  it("включает loading, ждёт 2 секунды и заполняет items", async () => {
    const { items, loading, load } = useItemsLoader();
    const promise = load();
    expect(loading.value).toBe(true);

    // Прокручиваем таймеры чуть меньше задержки — данные ещё не пришли
    await vi.advanceTimersByTimeAsync(LOAD_DELAY_MS - 1);
    expect(items.value).toEqual([]);

    // Докручиваем до конца задержки
    await vi.advanceTimersByTimeAsync(1);
    await promise;

    expect(loading.value).toBe(false);
    expect(items.value).toEqual(fixtureItems);
  });

  it("записывает ошибку при неуспешном ответе", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
      }),
    );
    const { loading, error, load } = useItemsLoader();
    const promise = load();
    await vi.advanceTimersByTimeAsync(LOAD_DELAY_MS);
    await promise;

    expect(loading.value).toBe(false);
    expect(error.value).toBeInstanceOf(Error);
  });
});
