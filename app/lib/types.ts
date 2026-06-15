export type ItemType = 'goal' | 'task' | 'note';
export type ItemStatus = 'todo' | 'in_progress' | 'done';

export interface Position {
  x: number;
  y: number;
}

export interface BaseItem {
  id: string;
  type: ItemType;
  title: string;
  description?: string;
  position: Position;
}

export interface GoalItem extends BaseItem {
  type: 'goal';
  status: ItemStatus;
  deadline?: string | null;
  dependsOn: string[];
}

export interface TaskItem extends BaseItem {
  type: 'task';
  status: ItemStatus;
  deadline?: string | null;
  goalId: string;
}

export interface NoteItem extends BaseItem {
  type: 'note';
}

export type Item = GoalItem | TaskItem | NoteItem;

export const GRID_SIZE = 20;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;
