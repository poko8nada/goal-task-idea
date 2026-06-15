import type { Item } from './types';

export const SAMPLE_ITEMS: Item[] = [
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
    position: { x: 250, y: 380 },
  },
];
