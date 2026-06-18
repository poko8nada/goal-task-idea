import type { ItemStatus } from '../lib/types';

const STATUS_LABEL: Record<ItemStatus, string> = {
  todo: 'todo',
  in_progress: 'in progress',
  done: 'done',
};

const STATUS_DOT_COLOR: Record<ItemStatus, string> = {
  todo: 'bg-gray-300',
  in_progress: 'bg-amber-400',
  done: 'bg-emerald-500',
};

export function StatusPill({ status, compact = false }: { status: ItemStatus; compact?: boolean }) {
  return (
    <span
      class={`inline-flex items-center gap-1.5 text-[11px] text-gray-500 ${compact ? '' : 'px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100'}`}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLOR[status]}`} />
      <span>{STATUS_LABEL[status]}</span>
    </span>
  );
}
