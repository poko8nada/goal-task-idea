import type { Item, GoalItem, TaskItem, NoteItem } from '../lib/types';

const STATUS_COLORS = {
  todo: 'bg-white border-gray-400',
  in_progress: 'bg-blue-100 border-blue-500',
  done: 'bg-green-100 border-green-500',
} as const;

interface ItemCardProps {
  item: Item;
  onDragStart: (id: string, e: PointerEvent) => void;
}

function GoalCard({
  item,
  onDragStart,
}: {
  item: GoalItem;
  onDragStart: ItemCardProps['onDragStart'];
}) {
  return (
    <div
      data-item-id={item.id}
      onPointerDown={(e: PointerEvent) => onDragStart(item.id, e)}
      class={`absolute w-48 p-3 rounded-lg border-2 ${STATUS_COLORS[item.status]} shadow-sm cursor-grab select-none`}
      style={{ left: `${item.position.x}px`, top: `${item.position.y}px` }}
    >
      <div class='text-xs text-gray-500 mb-1'>Goal</div>
      <div class='font-semibold text-sm'>{item.title}</div>
      {item.deadline && <div class='text-xs text-gray-500 mt-1'>📅 {item.deadline}</div>}
    </div>
  );
}

function TaskCard({
  item,
  onDragStart,
}: {
  item: TaskItem;
  onDragStart: ItemCardProps['onDragStart'];
}) {
  return (
    <div
      data-item-id={item.id}
      onPointerDown={(e: PointerEvent) => onDragStart(item.id, e)}
      class={`absolute w-40 p-2 rounded border ${STATUS_COLORS[item.status]} text-xs cursor-grab select-none`}
      style={{ left: `${item.position.x}px`, top: `${item.position.y}px` }}
    >
      <div class='text-gray-500 mb-0.5'>Task</div>
      <div>{item.title}</div>
    </div>
  );
}

function NoteCard({
  item,
  onDragStart,
}: {
  item: NoteItem;
  onDragStart: ItemCardProps['onDragStart'];
}) {
  return (
    <div
      data-item-id={item.id}
      onPointerDown={(e: PointerEvent) => onDragStart(item.id, e)}
      class='absolute w-40 p-2 rounded border border-yellow-400 bg-yellow-50 text-xs cursor-grab select-none'
      style={{ left: `${item.position.x}px`, top: `${item.position.y}px` }}
    >
      <div class='text-yellow-600 mb-0.5'>Note</div>
      <div>{item.title}</div>
    </div>
  );
}

export function ItemCard({ item, onDragStart }: ItemCardProps) {
  if (item.type === 'goal') return <GoalCard item={item} onDragStart={onDragStart} />;
  if (item.type === 'task') return <TaskCard item={item} onDragStart={onDragStart} />;
  return <NoteCard item={item} onDragStart={onDragStart} />;
}
