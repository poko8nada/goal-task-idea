import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isOk, isErr } from '~/utils/types';
import { createJsonFileDataSource } from './json-file';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(here, '__fixtures__');
const validPath = path.join(fixtures, 'valid.json');
const malformedPath = path.join(fixtures, 'malformed.json');
const missingPath = path.join(fixtures, 'does-not-exist.json');

describe('createJsonFileDataSource', () => {
  describe('list()', () => {
    // 有効なファイルから items を ok(...) で返す
    it('returns ok(items) from valid file', async () => {
      const source = createJsonFileDataSource(validPath);
      const result = await source.list();
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]?.id).toBe('g1');
        expect(result.value[1]?.id).toBe('t1');
        expect(result.value[2]?.id).toBe('n1');
      }
    });

    // ファイルが存在しない場合は err({ kind: 'io' }) を返す
    it('returns err({ kind: "io" }) when file is missing', async () => {
      const source = createJsonFileDataSource(missingPath);
      const result = await source.list();
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.kind).toBe('io');
      }
    });

    // JSON が壊れている場合は err({ kind: 'parse' }) を返す
    it('returns err({ kind: "parse" }) when JSON is malformed', async () => {
      const source = createJsonFileDataSource(malformedPath);
      const result = await source.list();
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.kind).toBe('parse');
      }
    });
  });

  describe('get()', () => {
    // id で一致する item を返す
    it('returns matching item by id', async () => {
      const source = createJsonFileDataSource(validPath);
      const item = await source.get('t1');
      expect(item).not.toBeUndefined();
      expect(item?.id).toBe('t1');
      expect(item?.type).toBe('task');
    });

    // 存在しない id で undefined を返す
    it('returns undefined for nonexistent id', async () => {
      const source = createJsonFileDataSource(validPath);
      const item = await source.get('does-not-exist');
      expect(item).toBeUndefined();
    });
  });
});
