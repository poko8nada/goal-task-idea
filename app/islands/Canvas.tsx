import { useRef, useEffect } from 'hono/jsx';
import { useCanvas } from '@/lib/useCanvas';
import type { Item, Position, GoalItem, TaskItem, NoteItem } from '@/lib/types';
import { GRID_SIZE } from '@/lib/types';
import { SAMPLE_ITEMS } from '@/lib/sample';
import { StatusPill } from '@/components/StatusPill';

interface CanvasProps {
  initialItems?: Item[];
}

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

  const goals = items.filter((i): i is GoalItem => i.type === 'goal');
  const tasks = items.filter((i): i is TaskItem => i.type === 'task');
  const notes = items.filter((i): i is NoteItem => i.type === 'note');

  const tasksByGoal = new Map<string, TaskItem[]>();
  for (const t of tasks) {
    const arr = tasksByGoal.get(t.goalId) ?? [];
    arr.push(t);
    tasksByGoal.set(t.goalId, arr);
  }

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
        {goals.map((goal) => {
          const ownedTasks = tasksByGoal.get(goal.id) ?? [];
          return (
            <div
              key={goal.id}
              data-goal-group={goal.id}
              class='absolute w-64 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow'
              style={{ left: `${goal.position.x}px`, top: `${goal.position.y}px` }}
            >
              <div
                data-item-id={goal.id}
                class='cursor-grab select-none px-4 py-3 border-b border-gray-100'
              >
                <div class='flex items-center justify-between mb-1.5'>
                  <span class='text-[11px] font-medium text-gray-400 tracking-wide uppercase'>Goal</span>
                  <StatusPill status={goal.status} />
                </div>
                <div class='text-[15px] font-semibold text-gray-900 leading-snug'>{goal.title}</div>
                {goal.deadline && <div class='text-xs text-gray-500 mt-1'>{goal.deadline}</div>}
              </div>
              {ownedTasks.length > 0 && (
                <ul class='py-1'>
                  {ownedTasks.map((task) => (
                    <li
                      key={task.id}
                      data-item-id={task.id}
                      class='flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 cursor-grab select-none text-sm'
                    >
                      <span class='text-gray-300 text-xs'>·</span>
                      <span class='flex-1 text-gray-700'>{task.title}</span>
                      <StatusPill status={task.status} compact />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {notes.map((note) => (
          <div
            key={note.id}
            data-item-id={note.id}
            class='absolute w-48 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm shadow-sm cursor-grab select-none hover:bg-white transition-colors'
            style={{ left: `${note.position.x}px`, top: `${note.position.y}px` }}
          >
            <div class='text-[11px] font-medium text-gray-400 tracking-wide uppercase mb-0.5'>Note</div>
            <div class='text-gray-700 leading-snug'>{note.title}</div>
          </div>
        ))}
      </div>
      <div class='absolute bottom-2 right-2 bg-white/80 px-2 py-1 text-xs rounded text-gray-600'>
        {Math.round(scale * 100)}% | ({Math.round(pan.x)}, {Math.round(pan.y)})
      </div>
      <div class='absolute bottom-2 right-2 bg-white/80 px-2 py-1 text-xs rounded text-gray-600'>
        {Math.round(scale * 100)}% | ({Math.round(pan.x)}, {Math.round(pan.y)})
      </div>
    </div>
  );
}
