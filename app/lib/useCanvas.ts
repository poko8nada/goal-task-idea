import { useState, useCallback } from 'hono/jsx';
import type { Item, Position } from './types';
import { GRID_SIZE, MIN_SCALE, MAX_SCALE } from './types';

export function useCanvas(initialItems: Item[]) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [items, setItems] = useState<Item[]>(initialItems);

  const snapToGrid = useCallback((value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const updateScale = useCallback((newScale: number) => {
    setScale(Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE));
  }, []);

  const updateItemPosition = useCallback((id: string, position: Position) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, position } : item)));
  }, []);

  const setPanValue = useCallback((newPan: Position) => {
    setPan(newPan);
  }, []);

  return {
    scale,
    pan,
    items,
    snapToGrid,
    updateScale,
    updateItemPosition,
    setPanValue,
  };
}
