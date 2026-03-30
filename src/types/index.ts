export type GTDContext =
  | '@computer'
  | '@phone'
  | '@errands'
  | '@home'
  | '@anywhere';

export const ALL_CONTEXTS: GTDContext[] = [
  '@computer',
  '@phone',
  '@errands',
  '@home',
  '@anywhere',
];

export interface Item {
  id: string;
  text: string;
  createdAt: number;
  clarified: boolean;
}

export interface Action {
  id: string;
  text: string;
  context: GTDContext;
  projectId?: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
  isFocused?: boolean;
}

export interface Project {
  id: string;
  title: string;
  outcome: string;
  actionIds: string[];
  done: boolean;
  createdAt: number;
}

export interface WaitingFor {
  id: string;
  text: string;
  person: string;
  followUpDate?: number;
  resolvedAt?: number;
  createdAt: number;
}

export interface SomedayItem {
  id: string;
  text: string;
  createdAt: number;
}
