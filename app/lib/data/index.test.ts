import { describe, it, expect } from 'vitest';
import { getDataSource } from './index';

describe('getDataSource()', () => {
  // 複数回呼ぶと同じ instance を返す（singleton）
  it('returns the same instance on multiple calls', () => {
    const a = getDataSource();
    const b = getDataSource();
    expect(a).toBe(b);
  });
});
