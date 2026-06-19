import type { Result } from '~/utils/types';
import type { Item } from '@/lib/types';

export type DataSourceError = { kind: 'io'; cause: unknown } | { kind: 'parse'; cause: unknown };

export type ItemCreate = Omit<Item, 'id'>;

export type ItemUpdate = Partial<Omit<Item, 'id' | 'type'>>;

export interface DataSource {
  list(): Promise<Result<Item[], DataSourceError>>;
  get(id: string): Promise<Item | undefined>;
  create(input: ItemCreate): Promise<Item>;
  update(id: string, input: ItemUpdate): Promise<Item>;
  delete(id: string): Promise<void>;
}
