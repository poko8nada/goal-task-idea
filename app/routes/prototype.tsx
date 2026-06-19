import { createRoute } from 'honox/factory';
import { StatusPill } from '@/components/StatusPill';
import { GRID_SIZE } from '@/lib/types';
import type { ItemStatus } from '@/lib/types';

const CARD_W = 240;
const HEADER_H = 78;
const TASK_H = 28;
const BORDER_H = 1;
const DOT_R = 4;

type Card = {
  id: string;
  title: string;
  status: ItemStatus;
  x: number;
  y: number;
  taskCount: number;
  dependsOn: string[];
  tasks?: Array<{ title: string; status: ItemStatus }>;
};
type Conn = { from: string; to: string };
function cardH(c: Card) {
  return HEADER_H + c.taskCount * TASK_H + BORDER_H;
}
function midY(c: Card) {
  return c.y + cardH(c) / 2;
}
function srcXY(c: Card): [number, number] {
  return [c.x + CARD_W, midY(c)];
}
function tgtXY(c: Card): [number, number] {
  return [c.x, midY(c)];
}
function resolveLines(cards: Card[], conns: Conn[]) {
  const m = new Map(cards.map((c) => [c.id, c]));
  return conns.map((cn) => {
    const a = m.get(cn.from)!,
      b = m.get(cn.to)!;
    return { x1: srcXY(a)[0], y1: srcXY(a)[1], x2: tgtXY(b)[0], y2: tgtXY(b)[1] };
  });
}
function dedup<T>(arr: T[]) {
  return [...new Set(arr.map((v) => JSON.stringify(v)))].map((v) => JSON.parse(v) as T);
}

function autoLayoutY(cards: Card[], canvasH = 400): Card[] {
  const PAD = 40;
  const groups = new Map<number, Card[]>();
  for (const c of cards) {
    const k = c.x;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(c);
  }
  for (const [, gc] of groups) {
    let y = PAD;
    for (const c of gc) {
      c.y = y;
      y += cardH(c) + PAD;
    }
    const o = Math.max(0, (canvasH - y + PAD) / 2);
    for (const c of gc) c.y += o;
  }
  return cards;
}

function SvgLayer({ cards, conns, markerId }: { cards: Card[]; conns: Conn[]; markerId: string }) {
  const lines = resolveLines(cards, conns);
  const map = new Map(cards.map((c) => [c.id, c]));
  const srcPts = dedup(conns.map((c) => srcXY(map.get(c.from)!)));
  const tgtPts = dedup(conns.map((c) => tgtXY(map.get(c.to)!)));
  return (
    <svg class='absolute inset-0 pointer-events-none' style={{ width: 1200, height: 500 }}>
      <defs>
        <marker id={markerId} markerWidth='8' markerHeight='6' refX='7' refY='3' orient='auto'>
          <path d='M0,0 L8,3 L0,6 Z' fill='#374151' />
        </marker>
      </defs>
      {lines.map((l, i) => (
        <line
          key={`l${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke='#374151'
          strokeWidth='1.5'
          markerEnd={`url(#${markerId})`}
        />
      ))}
      {srcPts.map(([cx, cy], i) => (
        <circle key={`s${i}`} cx={cx} cy={cy} r={DOT_R} fill='#3b82f6' />
      ))}
      {tgtPts.map(([cx, cy], i) => (
        <circle key={`t${i}`} cx={cx} cy={cy} r={DOT_R} fill='#f59e0b' />
      ))}
    </svg>
  );
}

function GoalCard({ card, children }: { card: Card; children?: unknown }) {
  return (
    <div
      style={{ left: card.x, top: card.y, width: CARD_W }}
      class='absolute rounded-lg border border-gray-200 bg-white shadow-sm'
    >
      <div class='px-3 py-2.5 border-b border-gray-100'>
        <div class='flex items-center justify-between mb-1.5'>
          <span class='text-[10px] font-semibold text-gray-500 tracking-wider uppercase'>Goal</span>
          <StatusPill status={card.status} />
        </div>
        <div class='text-[14px] font-semibold text-gray-900 leading-snug'>{card.title}</div>
        {card.dependsOn.length > 0 && (
          <div class='text-[10px] text-gray-400 mt-1'>depends on: {card.dependsOn.join(', ')}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function TaskRow({ title, status }: { title: string; status: ItemStatus }) {
  return (
    <div class='flex items-center gap-2 px-3 py-1 text-[13px] border-t border-gray-50'>
      <span class='text-gray-300 text-xs shrink-0'>↳</span>
      <span class='flex-1 text-gray-700'>{title}</span>
      <StatusPill status={status} compact />
    </div>
  );
}

function Frame({
  cards,
  conns,
  markerId,
  children,
  w = 1200,
  h = 400,
}: {
  cards: Card[];
  conns: Conn[];
  markerId: string;
  children?: unknown;
  w?: number;
  h?: number;
}) {
  return (
    <div
      class='relative overflow-hidden border border-gray-200 rounded-xl bg-gray-50'
      style={{ width: w, height: h }}
    >
      <div
        class='absolute inset-0'
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      />
      <SvgLayer cards={cards} conns={conns} markerId={markerId} />
      {cards.map((c) => (
        <GoalCard key={c.id} card={c}>
          {c.tasks?.map((t, i) => (
            <TaskRow key={i} title={t.title} status={t.status} />
          ))}
        </GoalCard>
      ))}
      {children}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: unknown;
}) {
  return (
    <div>
      <h3 class='text-[13px] font-semibold text-gray-800 mb-1'>{title}</h3>
      <p class='text-[12px] text-gray-500 mb-3'>{subtitle}</p>
      {children}
    </div>
  );
}

// ── Interaction States ──

// Default cards (reused across states)
const dA: Card = {
  id: 'A',
  title: 'Goal A',
  status: 'done',
  x: 100,
  y: 0,
  taskCount: 1,
  dependsOn: [],
  tasks: [{ title: 'task 1', status: 'done' }],
};
const dB: Card = {
  id: 'B',
  title: 'Goal B',
  status: 'done',
  x: 100,
  y: 0,
  taskCount: 1,
  dependsOn: [],
  tasks: [{ title: 'task 2', status: 'done' }],
};
const dC: Card = {
  id: 'C',
  title: 'Goal C',
  status: 'in_progress',
  x: 400,
  y: 0,
  taskCount: 1,
  dependsOn: ['A', 'B'],
  tasks: [{ title: 'task 3', status: 'in_progress' }],
};
const dD: Card = {
  id: 'D',
  title: 'Goal D',
  status: 'todo',
  x: 700,
  y: 0,
  taskCount: 0,
  dependsOn: ['C'],
};
const baseConns: Conn[] = [
  { from: 'A', to: 'C' },
  { from: 'B', to: 'C' },
  { from: 'C', to: 'D' },
];

// State 1: Default (hover on Goal B → show ✕ + editable)
function StateDefault() {
  return (
    <Frame cards={autoLayoutY([dA, dB, dC, dD])} conns={baseConns} markerId='s1'>
      {/* Hover state on Goal B: ✕ button + editable highlight */}
      <div
        style={{ left: dB.x + CARD_W - 20, top: dB.y + 4 }}
        class='absolute w-4 h-4 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] cursor-pointer hover:bg-red-50 hover:text-red-500'
      >
        ✕
      </div>
      <div
        style={{ left: dB.x + 2, top: dB.y + 2, width: CARD_W - 4, height: cardH(dB) - 4 }}
        class='absolute rounded-lg border-2 border-blue-300 pointer-events-none'
      />
    </Frame>
  );
}

// State 2: Right-click context menu (create standalone goal)
function StateContextMenu() {
  return (
    <Frame cards={autoLayoutY([dA, dB, dC, dD])} conns={baseConns} markerId='s2'>
      {/* Context menu at click position */}
      <div
        style={{ left: 650, top: 250 }}
        class='absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48 z-10'
      >
        <div class='px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer'>
          ここにゴールを作成
        </div>
        <div class='px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer'>
          タスクを貼り付け
        </div>
        <div class='border-t border-gray-100 my-0.5' />
        <div class='px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer'>
          すべて選択
        </div>
      </div>
      {/* Ghost card at click position */}
      <div
        style={{ left: 650, top: 300, width: CARD_W }}
        class='absolute rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 px-3 py-2.5'
      >
        <div class='text-[12px] text-blue-400'>新しいゴール</div>
      </div>
    </Frame>
  );
}

// State 3: Connection point drag (creating connected goal)
function StateDragConnect() {
  return (
    <Frame cards={autoLayoutY([dA, dB, dC, dD])} conns={baseConns} markerId='s3'>
      {/* Drag line from B's source to new position */}
      <svg class='absolute inset-0 pointer-events-none' style={{ width: 1200, height: 500 }}>
        <line
          x1={srcXY(dB)[0]}
          y1={srcXY(dB)[1]}
          x2={650}
          y2={350}
          stroke='#3b82f6'
          strokeWidth='2'
          strokeDasharray='6 3'
        />
        <circle
          cx={650}
          cy={350}
          r={6}
          fill='#3b82f6'
          fillOpacity='0.3'
          stroke='#3b82f6'
          strokeWidth='2'
        />
      </svg>
      {/* Ghost card at drag endpoint */}
      <div
        style={{ left: 650 - CARD_W, top: 350 - 40, width: CARD_W }}
        class='absolute rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 px-3 py-2.5'
      >
        <div class='text-[12px] text-blue-400'>新しいゴール (B に接続)</div>
      </div>
      {/* Highlight B's source point */}
      <div
        style={{ left: srcXY(dB)[0] - 6, top: srcXY(dB)[1] - 6 }}
        class='absolute w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-200'
      />
    </Frame>
  );
}

// State 4: Task creation (expanded goal card)
function StateTaskCreation() {
  const expandedCard: Card = { ...dC, y: 80 };
  return (
    <Frame cards={autoLayoutY([dA, dB, expandedCard, dD])} conns={baseConns} markerId='s4' h={480}>
      {/* "+ タスクを追加" button rendered below Goal C's task list */}
      <div
        style={{ left: dC.x, top: 80 + cardH(dC), width: CARD_W }}
        class='absolute bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-sm px-3 py-1.5 text-[12px] flex items-center gap-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer'
      >
        <span class='text-[10px] font-bold'>+</span> タスクを追加
      </div>
    </Frame>
  );
}

// State 5: Inline editing (double-click on title)
function StateInlineEdit() {
  return (
    <Frame cards={autoLayoutY([dA, dB, dC, dD])} conns={baseConns} markerId='s5'>
      {/* Inline editor on Goal C's title */}
      <div
        style={{ left: dC.x + 12, top: dC.y + 42, width: CARD_W - 24 }}
        class='absolute bg-white border border-blue-500 rounded px-2 py-1 shadow-sm z-10'
      >
        <input
          type='text'
          defaultValue='Goal C'
          aria-label='Goal title'
          class='w-full text-[14px] font-semibold text-gray-900 outline-none'
        />
      </div>
      {/* Status dropdown */}
      <div
        style={{ left: dC.x + 12, top: dC.y + 68, width: 120 }}
        class='absolute bg-white border border-gray-200 rounded shadow-lg py-1 z-10'
      >
        <div class='px-2 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5'>
          <span class='w-1.5 h-1.5 rounded-full bg-gray-300' /> todo
        </div>
        <div class='px-2 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5 bg-blue-50'>
          <span class='w-1.5 h-1.5 rounded-full bg-amber-400' /> in progress
        </div>
        <div class='px-2 py-1 text-[11px] hover:bg-gray-50 flex items-center gap-1.5'>
          <span class='w-1.5 h-1.5 rounded-full bg-emerald-500' /> done
        </div>
      </div>
    </Frame>
  );
}

// State 6: Delete confirmation (simplified — no options, just confirm)
function StateDeleteConfirm() {
  return (
    <div class='relative'>
      <Frame cards={autoLayoutY([dA, dB, dC, dD])} conns={baseConns} markerId='s6'>
        {/* Highlight Goal C for deletion */}
        <div
          style={{ left: dC.x - 2, top: dC.y - 2, width: CARD_W + 4, height: cardH(dC) + 4 }}
          class='absolute rounded-lg border-2 border-red-400 pointer-events-none'
        />
      </Frame>
      {/* Modal overlay */}
      <div
        class='absolute inset-0 bg-black/30 flex items-center justify-center'
        style={{ width: 1200, height: 400 }}
      >
        <div class='bg-white rounded-lg shadow-xl w-105 border border-gray-200'>
          <div class='px-5 py-4'>
            <h4 class='text-[15px] font-semibold text-gray-900 mb-2'>このゴールを削除しますか?</h4>
            <p class='text-[12px] text-gray-600 leading-relaxed'>
              「Goal C」を削除すると、接続していた 2 本の矢印 (A→C, B→C) と 1 本の矢印 (C→D)
              が切断されます。
            </p>
          </div>
          <div class='px-5 py-3 border-t border-gray-100 flex justify-end gap-2'>
            <button class='px-3 py-1.5 text-[12px] text-gray-700 border border-gray-200 rounded'>
              キャンセル
            </button>
            <button class='px-3 py-1.5 text-[12px] text-white bg-red-600 rounded'>削除</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default createRoute((c) =>
  c.render(
    <div class='max-w-310 mx-auto px-6 py-8 space-y-12'>
      <div>
        <h2 class='text-lg font-bold text-gray-900 mb-1'>v1 Canvas — Interaction States</h2>
        <p class='text-[13px] text-gray-500'>各操作の視覚的イメージ。複数の状態を 1 画面に表示。</p>
      </div>

      <Section
        title='1. Default (hover on Goal B)'
        subtitle='card を hover すると右上に ✕ ボタン + 選択枠が表示される。'
      >
        <StateDefault />
      </Section>

      <Section
        title='2. Right-click context menu'
        subtitle='canvas 空白を右クリック → 独立した goal を作成。ここにゴールを作成を click。'
      >
        <StateContextMenu />
      </Section>

      <Section
        title='3. Connection point drag'
        subtitle='Goal B の右端 (青丸) を drag → 新規 goal 作成 + 矢印自動接続。'
      >
        <StateDragConnect />
      </Section>

      <Section
        title='4. Task creation'
        subtitle='Goal C を click → タスク一覧展開 → 下部の「+ タスクを追加」で追加。'
      >
        <StateTaskCreation />
      </Section>

      <Section
        title='5. Inline editing'
        subtitle='Goal C を double-click → title / status が inline 編集モードに。'
      >
        <StateInlineEdit />
      </Section>

      <Section
        title='6. Delete confirmation'
        subtitle='✕ ボタン click → 確認モーダル (選択肢なし、矢印が切れるだけ)。'
      >
        <StateDeleteConfirm />
      </Section>
    </div>,
  ),
);
