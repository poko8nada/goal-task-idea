import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJsonFileDataSource } from './json-file';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(here, '__fixtures__');
const validPath = path.join(fixtures, 'valid.json');
const malformedPath = path.join(fixtures, 'malformed.json');
const missingPath = path.join(fixtures, 'does-not-exist.json');

describe('createJsonFileDataSource', () => {
  describe('list()', () => {
    // 有効なファイルから items を返す
    it('returns items from valid file', async () => {
      const source = createJsonFileDataSource(validPath);
      const items = await source.list();
      expect(items).toHaveLength(3);
      expect(items[0]?.id).toBe('g1');
      expect(items[1]?.id).toBe('t1');
      expect(items[2]?.id).toBe('n1');
    });

    // ファイルが存在しない場合に throw する
    it('throws when file is missing', async () => {
      const source = createJsonFileDataSource(missingPath);
      await expect(source.list()).rejects.toThrow();
    });

    // JSON が壊れている場合に throw する（SyntaxError）
    it('throws when JSON is malformed', async () => {
      const source = createJsonFileDataSource(malformedPath);
      await expect(source.list()).rejects.toThrow(SyntaxError);
    });
  });

  describe('get()', () => {
    // id で一致する item を返す
    it('returns matching item by id', async () => {
      const source = createJsonFileDataSource(validPath);
      const item = await source.get('t1');
      expect(item).not.toBeNull();
      expect(item?.id).toBe('t1');
      expect(item?.type).toBe('task');
    });

    // 存在しない id で null を返す
    it('returns null for nonexistent id', async () => {
      const source = createJsonFileDataSource(validPath);
      const item = await source.get('does-not-exist');
      expect(item).toBeNull();
    });
  });
});
