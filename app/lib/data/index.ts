import { createJsonFileDataSource } from './json-file';
import type { DataSource } from './source';

let cached: DataSource | null = null;

export function getDataSource(): DataSource {
  if (cached === null) {
    cached = createJsonFileDataSource();
  }
  return cached;
}

export type { DataSource, ItemCreate, ItemUpdate } from './source';
