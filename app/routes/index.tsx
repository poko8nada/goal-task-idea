import { createRoute } from 'honox/factory';
import Canvas from '../islands/Canvas';

export default createRoute((c) => {
  return c.render(
    <div>
      <h1 class='text-2xl font-bold p-4'>Goal Task Idea</h1>
      <Canvas />
    </div>,
  );
});
