import { useRef, useEffect } from 'hono/jsx';
import { useCanvas } from '../lib/useCanvas';
import type { Item, Position } from '../lib/types';
import { GRID_SIZE } from '../lib/types';
import { ItemCard } from '../components/ItemCard';

interface CanvasProps {
  initialItems?: Item[];
}

const SAMPLE_ITEMS: Item[] = [
  {
    id: 'goal-1',
    type: 'goal',
    title: '基礎を学ぶ',
    status: 'done',
    dependsOn: [],
    position: { x: 100, y: 100 },
  },
  {
    id: 'goal-2',
    type: 'goal',
    title: 'プロジェクトを作る',
    status: 'in_progress',
    dependsOn: ['goal-1'],
    position: { x: 400, y: 100 },
  },
  {
    id: 'goal-3',
    type: 'goal',
    title: 'デプロイする',
    status: 'todo',
    dependsOn: ['goal-2'],
    position: { x: 700, y: 100 },
  },
  {
    id: 'task-1',
    type: 'task',
    title: 'ドキュメントを読む',
    status: 'done',
    goalId: 'goal-1',
    position: { x: 120, y: 220 },
  },
  {
    id: 'task-2',
    type: 'task',
    title: 'サンプルを動かす',
    status: 'done',
    goalId: 'goal-1',
    position: { x: 120, y: 280 },
  },
  {
    id: 'task-3',
    type: 'task',
    title: '要件定義',
    status: 'in_progress',
    goalId: 'goal-2',
    position: { x: 420, y: 220 },
  },
  {
    id: 'note-1',
    type: 'note',
    title: 'Next.jsも調べてみる',
    position: { x: 250, y: 350 },
  },
];

export default function Canvas({ initialItems = SAMPLE_ITEMS }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scale, pan, items, snapToGrid, updateScale, updateItemPosition, setPanValue } =
    useCanvas(initialItems);

  const stateRef = useRef<{
    scale: number;
    pan: Position;
    items: Item[];
    snapToGrid: (value: number) => number;
    updateScale: (newScale: number) => void;
    updateItemPosition: (id: string, position: Position) => void;
    setPanValue: (newPan: Position) => void;
  } | null>(null);
  stateRef.current = {
    scale,
    pan,
    items,
    snapToGrid,
    updateScale,
    updateItemPosition,
    setPanValue,
  };

  const dragStateRef = useRef<{
    mode: 'pan' | 'item' | null;
    itemId?: string;
    startX: number;
    startY: number;
    startPan?: Position;
    startItemPos?: Position;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current!.scale;
      const p = stateRef.current!.pan;
      const us = stateRef.current!.updateScale;
      const spv = stateRef.current!.setPanValue;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - p.x) / s;
      const worldY = (mouseY - p.y) / s;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = s * delta;

      const newPanX = mouseX - worldX * newScale;
      const newPanY = mouseY - worldY * newScale;

      us(newScale);
      spv({ x: newPanX, y: newPanY });
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const itemEl = target.closest('[data-item-id]') as HTMLElement | null;
      const p = stateRef.current!.pan;
      const its = stateRef.current!.items;

      if (itemEl) {
        const id = itemEl.dataset.itemId!;
        const item = its.find((i: Item) => i.id === id);
        if (!item) return;
        dragStateRef.current = {
          mode: 'item',
          itemId: id,
          startX: e.clientX,
          startY: e.clientY,
          startItemPos: { ...item.position },
        };
        itemEl.setPointerCapture(e.pointerId);
      } else {
        dragStateRef.current = {
          mode: 'pan',
          startX: e.clientX,
          startY: e.clientY,
          startPan: { ...p },
        };
        el.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || !state.mode) return;
      const s = stateRef.current!.scale;
      const stg = stateRef.current!.snapToGrid;
      const uip = stateRef.current!.updateItemPosition;
      const spv = stateRef.current!.setPanValue;

      if (state.mode === 'pan' && state.startPan) {
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        spv({ x: state.startPan.x + dx, y: state.startPan.y + dy });
      } else if (state.mode === 'item' && state.itemId && state.startItemPos) {
        const dx = (e.clientX - state.startX) / s;
        const dy = (e.clientY - state.startY) / s;
        const newX = stg(state.startItemPos.x + dx);
        const newY = stg(state.startItemPos.y + dy);
        uip(state.itemId, { x: newX, y: newY });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (state && state.mode === 'item' && state.itemId) {
        const itemEl = el.querySelector(`[data-item-id="${state.itemId}"]`) as HTMLElement | null;
        itemEl?.releasePointerCapture(e.pointerId);
      } else if (state && state.mode === 'pan') {
        el.releasePointerCapture(e.pointerId);
      }
      dragStateRef.current = null;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const gridStyle: Record<string, string> = {
    backgroundImage: `
      linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
    `,
    backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
    backgroundPosition: `${pan.x}px ${pan.y}px`,
  };

  return (
    <div
      ref={containerRef}
      class='w-full h-[calc(100vh-4rem)] overflow-hidden relative cursor-grab active:cursor-grabbing'
      style={gridStyle as Record<string, string>}
    >
      <div
        class='absolute top-0 left-0 origin-top-left'
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onDragStart={() => {}} />
        ))}
      </div>
      <div class='absolute bottom-2 right-2 bg-white/80 px-2 py-1 text-xs rounded text-gray-600'>
        {Math.round(scale * 100)}% | ({Math.round(pan.x)}, {Math.round(pan.y)})
      </div>
    </div>
  );
}
