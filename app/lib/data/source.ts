import type { Item } from '@/lib/types';

export type ItemCreate = Omit<Item, 'id'>;

export type ItemUpdate = Partial<Omit<Item, 'id' | 'type'>>;

export interface DataSource {
  list(): Promise<Item[]>;
  get(id: string): Promise<Item | null>;
  create(input: ItemCreate): Promise<Item>;
  update(id: string, input: ItemUpdate): Promise<Item>;
  delete(id: string): Promise<void>;
}
