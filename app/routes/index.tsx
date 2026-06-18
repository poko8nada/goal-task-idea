import { createRoute } from 'honox/factory';
import Canvas from '@/islands/Canvas';

export default createRoute((c) => {
  return c.render(<Canvas />);
});
