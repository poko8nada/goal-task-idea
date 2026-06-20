import { createRoute } from 'honox/factory';

const CARD_W = 220;
const LANE_GAP = 32;
const LANE_W = CARD_W + LANE_GAP;
const HEADER_H = 66;
const TASK_ROW_H = 30;
const PAD_X = 12;
const PAD_Y = 14;
const ROW_LABEL_W = 74;
const ROW_GAP_Y = 0;
const TAB_W = 8;
const CANVAS_PAD = 20;

// ── Data ──

type ItemStatus = 'todo' | 'in_progress' | 'done';

type Card = {
  id: string;
  project: string;
  title: string;
  status: ItemStatus;
  timeLane: number;
  tasks?: Array<{ title: string; status: ItemStatus }>;
};

type ProjectRow = {
  id: string;
  name: string;
  accent: string;
  track: string;
  bg: string;
};

function Dot({ status, compact }: { status: ItemStatus; compact?: boolean }) {
  const c: Record<string, string> = {
    done: 'bg-emerald-500',
    in_progress: 'bg-amber-400',
    todo: 'bg-gray-300',
  };
  const l: Record<string, string> = { done: 'done', in_progress: 'in progress', todo: 'todo' };
  return (
    <span
      class={`inline-flex items-center gap-1 ${compact ? 'text-[10px]' : 'text-[11px]'} text-gray-500`}
    >
      <span class={`w-1.5 h-1.5 rounded-full shrink-0 ${c[status]}`} />
      {!compact && <span>{l[status]}</span>}
    </span>
  );
}

// ── Layout ──

function cardH(c: Card): number {
  return HEADER_H + (c.tasks?.length ?? 0) * TASK_ROW_H;
}

function timeLaneX(lane: number): number {
  return ROW_LABEL_W + PAD_X + lane * LANE_W;
}

const rows: ProjectRow[] = [
  { id: 'P1', name: 'アプリ開発', accent: 'text-blue-600', track: '#93c5fd', bg: '#eff6ff' },
  { id: 'P2', name: 'ブログ運営', accent: 'text-amber-600', track: '#fcd34d', bg: '#fffbeb' },
];

const cards: Card[] = [
  {
    id: 'p1a',
    project: 'P1',
    title: '要件定義',
    status: 'done',
    timeLane: 0,
    tasks: [{ title: 'ヒアリング', status: 'done' }],
  },
  {
    id: 'p1b',
    project: 'P1',
    title: '設計',
    status: 'done',
    timeLane: 1,
    tasks: [
      { title: '画面設計', status: 'done' },
      { title: 'DB設計', status: 'done' },
    ],
  },
  {
    id: 'p1c',
    project: 'P1',
    title: '実装',
    status: 'in_progress',
    timeLane: 2,
    tasks: [
      { title: 'API作成', status: 'in_progress' },
      { title: '画面作成', status: 'todo' },
    ],
  },
  { id: 'p1d', project: 'P1', title: 'テスト', status: 'todo', timeLane: 4, tasks: [] },
  {
    id: 'p2a',
    project: 'P2',
    title: '記事構成',
    status: 'done',
    timeLane: 1,
    tasks: [{ title: 'キーワード選定', status: 'done' }],
  },
  {
    id: 'p2b',
    project: 'P2',
    title: '執筆',
    status: 'in_progress',
    timeLane: 2,
    tasks: [{ title: '本文作成', status: 'in_progress' }],
  },
  { id: 'p2c', project: 'P2', title: '公開・分析', status: 'todo', timeLane: 3, tasks: [] },
];

const crossConns: Array<{ from: string; to: string }> = [{ from: 'p1c', to: 'p2b' }];

// ── Page ──

export default createRoute((ctx) => {
  // Group cards by project
  const pjCards = rows.map((r) => cards.filter((c) => c.project === r.id));

  // Compute row heights (based on tallest card + padding)
  const rowHeights: number[] = pjCards.map((cs) => {
    let max = 0;
    for (const c of cs) {
      const h = cardH(c);
      if (h > max) max = h;
    }
    return Math.max(max, 40) + PAD_Y * 2 + 12;
  });

  // Row Y offsets (for cross-PJ arrow positioning)
  const rowYOffs: number[] = [0];
  for (let i = 1; i < rows.length; i++) {
    rowYOffs.push(rowYOffs[i - 1] + rowHeights[i - 1] + ROW_GAP_Y);
  }

  const totalH = rowYOffs[rowYOffs.length - 1] + rowHeights[rowHeights.length - 1] + CANVAS_PAD * 2;

  // Max lane for canvas width
  const maxLane = Math.max(...cards.map((c) => c.timeLane), 0);
  const totalW = timeLaneX(maxLane + 1) + PAD_X;

  // Per-project data
  const pjMaxLane = new Map<string, number>();
  const pjMinX = new Map<string, number>();
  const pjMaxX = new Map<string, number>();
  for (const c of cards) {
    const cur = pjMaxLane.get(c.project) ?? -1;
    if (c.timeLane > cur) pjMaxLane.set(c.project, c.timeLane);
  }
  for (const c of cards) {
    const x = timeLaneX(c.timeLane);
    const l = pjMinX.get(c.project);
    const r = pjMaxX.get(c.project);
    if (l === undefined || x < l) pjMinX.set(c.project, x);
    if (r === undefined || x + CARD_W > r) pjMaxX.set(c.project, x + CARD_W);
  }

  // Card position lookup for cross-PJ arrows
  const cardPos = new Map<string, { x: number; y: number; h: number; row: number }>();
  for (let ri = 0; ri < rows.length; ri++) {
    for (const c of pjCards[ri]) {
      cardPos.set(c.id, {
        x: timeLaneX(c.timeLane),
        y: PAD_Y,
        h: cardH(c),
        row: ri,
      });
    }
  }

  const canvasW = Math.max(800, totalW + CANVAS_PAD * 2);

  return ctx.render(
    <div class='px-2 py-8 space-y-12'>
      <div>
        <h2 class='text-lg font-bold text-gray-900 mb-1'>v2 Canvas — Swimlane Layout</h2>
        <p class='text-[13px] text-gray-500'>
          PJごとに独立したスイムレーン。色付きトラックラインとエッジタブで流れを表現。
        </p>
      </div>

      <div>
        <h3 class='text-[13px] font-semibold text-gray-800 mb-1'>1. Default</h3>
        <p class='text-[12px] text-gray-500 mb-3'>
          PJ間の依存は同一時間レーン内のみ。実装→執筆を垂直の破線矢印で表示。
        </p>

        <div id='section-default' class='relative' style={{ width: canvasW, padding: CANVAS_PAD }}>
          {/* Canvas background panel */}
          <div
            class='absolute inset-0 rounded-xl border border-gray-200 shadow-sm'
            style={{
              height: totalH,
              backgroundColor: '#fafaf9',
              backgroundImage:
                'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Cross-PJ dependency arrows (overlay above all rows) */}
          <svg
            class='absolute inset-0 pointer-events-none z-10'
            style={{ width: '100%', height: totalH }}
          >
            {crossConns.map((cn, i) => {
              const src = cardPos.get(cn.from);
              const tgt = cardPos.get(cn.to);
              if (!src || !tgt) return null;
              const cx = src.x + CARD_W / 2;
              const srcY = rowYOffs[src.row] + src.y + src.h;
              const tgtY = rowYOffs[tgt.row] + tgt.y;
              return (
                <>
                  <line
                    key={`cl${i}`}
                    x1={cx}
                    y1={srcY + 4}
                    x2={cx}
                    y2={tgtY - 4}
                    stroke='#9ca3af'
                    strokeWidth='1.5'
                  />
                  {/* Source tab (bottom of source card) */}
                  <rect
                    key={`st${i}`}
                    x={cx - 3}
                    y={srcY}
                    width={6}
                    height={6}
                    rx={1}
                    fill='#9ca3af'
                  />
                  {/* Target tab (top of target card) */}
                  <rect
                    key={`tt${i}`}
                    x={cx - 3}
                    y={tgtY - 6}
                    width={6}
                    height={6}
                    rx={1}
                    fill='#9ca3af'
                  />
                </>
              );
            })}
          </svg>

          {/* Rows */}
          <div class='flex flex-col w-full'>
            {rows.map((row, ri) => {
              const cs = pjCards[ri];
              const minX = pjMinX.get(row.id);
              const maxX = pjMaxX.get(row.id);
              const isFirst = ri === 0;
              const isLast = ri === rows.length - 1;

              return (
                <div key={`row-${ri}`}>
                  {/* Separator between rows: solid (label area) + dashed (card area) */}
                  {!isFirst && (
                    <div style={{ width: '100%', height: 1, display: 'flex' }}>
                      <div style={{ width: ROW_LABEL_W, height: 1, backgroundColor: '#e5e7eb' }} />
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          backgroundImage:
                            'repeating-linear-gradient(to right, #e5e7eb 0, #e5e7eb 4px, transparent 4px, transparent 8px)',
                        }}
                      />
                    </div>
                  )}
                  <div
                    class={`relative bg-white ${isFirst ? 'border-t rounded-tl-lg' : ''} ${isLast ? 'border-b rounded-bl-lg' : ''} border-l border-r border-gray-300 rounded-l-lg`}
                    style={{ width: '100%', height: rowHeights[ri] }}
                  >
                    {/* Time lane vertical separators */}
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={`vl-${i}`}
                        class='absolute top-0 bottom-0 border-l border-dashed border-gray-200'
                        style={{ left: timeLaneX(i) - LANE_GAP / 2 }}
                      />
                    ))}

                    {/* Label area */}
                    <div
                      class='absolute top-0 bottom-0 border-r border-gray-200 bg-white/60 flex items-center px-1.5'
                      style={{ width: ROW_LABEL_W }}
                    >
                      <div class='flex items-center gap-1 w-full'>
                        <div class='flex flex-col gap-[2px] opacity-25 shrink-0'>
                          <div class='w-[10px] h-[2px] rounded-full bg-gray-400' />
                          <div class='w-[10px] h-[2px] rounded-full bg-gray-400' />
                          <div class='w-[10px] h-[2px] rounded-full bg-gray-400' />
                        </div>
                        <span
                          class={`text-[11px] font-semibold ${row.accent} leading-tight truncate`}
                        >
                          {row.name}
                        </span>
                      </div>
                    </div>

                    {/* Track line */}
                    {minX !== undefined && maxX !== undefined && (
                      <div
                        class='absolute'
                        style={{
                          top: PAD_Y + HEADER_H / 2,
                          left: minX,
                          width: maxX - minX,
                          height: 2,
                          backgroundColor: row.track,
                        }}
                      />
                    )}

                    {/* Cards */}
                    {cs.map((cp) => {
                      const x = timeLaneX(cp.timeLane);
                      const isLastCard = cp.timeLane === (pjMaxLane.get(cp.project) ?? 0);
                      const isP1 = cp.project === 'P1';
                      return (
                        <div
                          key={cp.id}
                          style={{ left: x, top: PAD_Y, width: CARD_W }}
                          class={`absolute rounded-lg border border-gray-200 bg-white shadow-sm ${isP1 ? 'border-l-blue-400' : 'border-l-amber-400'} border-l-[3px]`}
                        >
                          <div class='px-3 py-2 border-b border-gray-100 rounded-tr-lg'>
                            <div class='text-[13px] font-semibold text-gray-900 leading-snug'>
                              {cp.title}
                            </div>
                            <div class='mt-1'>
                              <Dot status={cp.status} />
                            </div>
                          </div>
                          {cp.tasks?.map((t, i) => (
                            <div
                              key={i}
                              class='flex items-center gap-2 px-3 py-1 text-[12px] border-t border-gray-50'
                            >
                              <span class='text-gray-300 text-xs shrink-0'>↳</span>
                              <span class='flex-1 text-gray-700'>{t.title}</span>
                              <Dot status={t.status} compact />
                            </div>
                          ))}
                          {!isLastCard && (
                            <div
                              class='absolute rounded-r-sm'
                              style={{
                                right: -TAB_W,
                                top: HEADER_H / 2 - 3,
                                width: TAB_W,
                                height: 6,
                                backgroundColor: isP1 ? '#93c5fd' : '#fcd34d',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
  );
});
