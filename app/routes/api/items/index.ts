import { createRoute } from 'honox/factory';
import { isOk } from '~/utils/types';
import { getDataSource } from '@/lib/data';

export const GET = createRoute(async (c) => {
  const source = getDataSource();
  const result = await source.list();
  if (!isOk(result)) {
    return c.json({ error: { kind: result.error.kind } }, 500);
  }
  return c.json({ items: result.value });
});
