import { createRoute } from 'honox/factory';
import Canvas from '@/islands/Canvas';
import { ErrorPage } from '@/components/ErrorPage';
import { isOk } from '~/utils/types';
import { getDataSource } from '@/lib/data';

export default createRoute(async (c) => {
  const source = getDataSource();
  const result = await source.list();
  if (!isOk(result)) {
    return c.render(<ErrorPage kind={result.error.kind} />);
  }
  return c.render(<Canvas initialItems={result.value} />);
});
