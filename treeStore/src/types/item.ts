export type ItemId = string | number;

export interface Item {
  id: ItemId;
  parent: ItemId | null;
  label: string;
  [key: string]: unknown;
}

export interface TreeStoreEntry {
  item: Item;
  childrenIds: ItemId[];
}
