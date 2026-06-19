import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { DataSource, ItemCreate, ItemUpdate } from './source';
import type { Item } from '@/lib/types';

const DEFAULT_DATA_FILE = path.resolve(process.cwd(), 'app/data/data.json');

interface DataFile {
  version: number;
  project: { id: string; name: string; description: string };
  context: { profile: string };
  items: Item[];
}

async function readData(filePath: string): Promise<DataFile> {
  const buf = await readFile(filePath, 'utf-8');
  return JSON.parse(buf) as DataFile;
}

export function createJsonFileDataSource(filePath: string = DEFAULT_DATA_FILE): DataSource {
  async function list(): Promise<Item[]> {
    const data = await readData(filePath);
    return data.items;
  }

  return {
    list,
    async get(id) {
      const items = await list();
      return items.find((i) => i.id === id) ?? null;
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
