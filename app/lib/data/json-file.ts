import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ok, err, isErr } from '~/utils/types';
import type { Result } from '~/utils/types';
import type { DataSource, DataSourceError, ItemCreate, ItemUpdate } from './source';
import type { Item } from '@/lib/types';

const DEFAULT_DATA_FILE = path.resolve(process.cwd(), 'app/data/data.json');

interface DataFile {
  version: number;
  project: { id: string; name: string; description: string };
  context: { profile: string };
  items: Item[];
}

async function readData(filePath: string): Promise<Result<DataFile, DataSourceError>> {
  let buf: string;
  try {
    buf = await readFile(filePath, 'utf-8');
  } catch (cause) {
    return err({ kind: 'io', cause });
  }
  try {
    const data = JSON.parse(buf) as DataFile;
    return ok(data);
  } catch (cause) {
    return err({ kind: 'parse', cause });
  }
}

export function createJsonFileDataSource(filePath: string = DEFAULT_DATA_FILE): DataSource {
  async function list(): Promise<Result<Item[], DataSourceError>> {
    const result = await readData(filePath);
    if (isErr(result)) {
      return err<Item[], DataSourceError>(result.error);
    }
    return ok(result.value.items);
  }

  return {
    list,
    /**
     * Returns the matching item, or undefined if not found.
     * Note: throws on IO error (file missing, parse error). This is a deliberate
     * exception to the "no throw across module boundaries" rule — get() is not
     * expected to be called in performance-critical paths, and the data file
     * missing is a catastrophic state that should fail loudly.
     */
    async get(id) {
      const result = await list();
      if (isErr(result)) {
        throw result.error.cause;
      }
      return result.value.find((i) => i.id === id) ?? undefined;
    },
    async create(_input: ItemCreate): Promise<Item> {
      throw new Error('create not implemented');
    },
    async update(_id: string, _input: ItemUpdate): Promise<Item> {
      throw new Error('update not implemented');
    },
    async delete(_id: string): Promise<void> {
      throw new Error('delete not implemented');
    },
  };
}
