import { ref, shallowRef, type Ref } from "vue";
import type { Item } from "@/types/item";

/** Искусственная задержка загрузки (мс), имитирует медленный сервер */
export const LOAD_DELAY_MS = 2000;

export interface UseItemsLoaderResult {
  items: Ref<Item[]>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  load: () => Promise<void>;
}

/**
 * Загружает items.json через fetch с искусственной задержкой
 * Реактивно отдаёт состояние загрузки
 */
export function useItemsLoader(url = "/items.json"): UseItemsLoaderResult {
  const items = shallowRef<Item[]>([]);
  const loading = ref(false);
  const error = ref<unknown>(null);

  const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const [response] = await Promise.all([fetch(url), delay(LOAD_DELAY_MS)]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as Item[];
      items.value = data;
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, error, load };
}
