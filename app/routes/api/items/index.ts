import { createRoute } from 'honox/factory';
import { getDataSource } from '@/lib/data';

export const GET = createRoute(async (c) => {
  const source = getDataSource();
  const items = await source.list();
  return c.json({ items });
});
