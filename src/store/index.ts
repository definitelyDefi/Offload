import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {useShallow} from 'zustand/react/shallow';
import {createMMKV} from 'react-native-mmkv';
import type {
  Item,
  Action,
  Project,
  WaitingFor,
  SomedayItem,
  GTDContext,
} from '../types';

const mmkv = createMMKV({id: 'offload-store'});

const mmkvStorage = {
  getItem: (name: string): string | null => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string): void => mmkv.set(name, value),
  removeItem: (name: string): void => { mmkv.remove(name); },
};

const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface AppState {
  items: Item[];
  actions: Action[];
  projects: Project[];
  waitingFor: WaitingFor[];
  somedayItems: SomedayItem[];
  lastReviewedAt: number | null;
  reviewHistory: number[];

  // Inbox
  addItem: (text: string) => void;
  updateItem: (id: string, text: string) => void;
  clarifyItem: (id: string) => void;
  deleteItem: (id: string) => void;

  // Actions
  addAction: (text: string, context: GTDContext, projectId?: string, dueDate?: number) => string;
  updateAction: (id: string, text: string, context: GTDContext, dueDate?: number) => void;
  toggleFocusAction: (id: string) => void;
  completeAction: (id: string) => void;
  uncompleteAction: (id: string) => void;
  deleteAction: (id: string) => void;

  // Projects
  addProject: (title: string, outcome: string) => string;
  updateProject: (id: string, title: string, outcome: string) => void;
  linkActionToProject: (projectId: string, actionId: string) => void;
  completeProject: (id: string) => void;
  deleteProject: (id: string) => void;

  // Waiting For
  addWaitingFor: (text: string, person: string, followUpDate?: number) => void;
  updateWaitingFor: (id: string, text: string, person: string, followUpDate?: number) => void;
  resolveWaitingFor: (id: string) => void;
  deleteWaitingFor: (id: string) => void;

  // Someday / Maybe
  addSomedayItem: (text: string) => void;
  updateSomedayItem: (id: string, text: string) => void;
  deleteSomedayItem: (id: string) => void;
  promoteSomedayToInbox: (id: string) => void;

  // Weekly Review
  completeReview: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      actions: [],
      projects: [],
      waitingFor: [],
      somedayItems: [],
      lastReviewedAt: null,
      reviewHistory: [],

      // --- Inbox ---
      addItem: text =>
        set(s => ({
          items: [
            ...s.items,
            {id: uid(), text: text.trim(), createdAt: Date.now(), clarified: false},
          ],
        })),

      updateItem: (id, text) =>
        set(s => ({
          items: s.items.map(i => (i.id === id ? {...i, text: text.trim()} : i)),
        })),

      clarifyItem: id =>
        set(s => ({
          items: s.items.map(i => (i.id === id ? {...i, clarified: true} : i)),
        })),

      deleteItem: id =>
        set(s => ({items: s.items.filter(i => i.id !== id)})),

      // --- Actions ---
      addAction: (text, context, projectId, dueDate) => {
        const id = uid();
        set(s => ({
          actions: [
            ...s.actions,
            {id, text: text.trim(), context, projectId, done: false, createdAt: Date.now(), dueDate},
          ],
        }));
        return id;
      },

      updateAction: (id, text, context, dueDate) =>
        set(s => ({
          actions: s.actions.map(a =>
            a.id === id ? {...a, text: text.trim(), context, dueDate} : a,
          ),
        })),

      toggleFocusAction: id =>
        set(s => ({
          actions: s.actions.map(a =>
            a.id === id ? {...a, isFocused: !a.isFocused} : a,
          ),
        })),

      completeAction: id =>
        set(s => ({
          actions: s.actions.map(a =>
            a.id === id ? {...a, done: true, completedAt: Date.now()} : a,
          ),
        })),

      uncompleteAction: id =>
        set(s => ({
          actions: s.actions.map(a =>
            a.id === id ? {...a, done: false, completedAt: undefined} : a,
          ),
        })),

      deleteAction: id =>
        set(s => ({
          actions: s.actions.filter(a => a.id !== id),
          projects: s.projects.map(p => ({
            ...p,
            actionIds: p.actionIds.filter(aid => aid !== id),
          })),
        })),

      // --- Projects ---
      addProject: (title, outcome) => {
        const id = uid();
        set(s => ({
          projects: [
            ...s.projects,
            {id, title: title.trim(), outcome: outcome.trim(), actionIds: [], done: false, createdAt: Date.now()},
          ],
        }));
        return id;
      },

      updateProject: (id, title, outcome) =>
        set(s => ({
          projects: s.projects.map(p =>
            p.id === id ? {...p, title: title.trim(), outcome: outcome.trim()} : p,
          ),
        })),

      linkActionToProject: (projectId, actionId) =>
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId && !p.actionIds.includes(actionId)
              ? {...p, actionIds: [...p.actionIds, actionId]}
              : p,
          ),
        })),

      completeProject: id =>
        set(s => ({
          projects: s.projects.map(p => (p.id === id ? {...p, done: true} : p)),
        })),

      deleteProject: id => {
        const project = get().projects.find(p => p.id === id);
        set(s => ({
          projects: s.projects.filter(p => p.id !== id),
          actions: s.actions.filter(a => !project?.actionIds.includes(a.id)),
        }));
      },

      // --- Waiting For ---
      addWaitingFor: (text, person, followUpDate) =>
        set(s => ({
          waitingFor: [
            ...s.waitingFor,
            {id: uid(), text: text.trim(), person: person.trim(), followUpDate, createdAt: Date.now()},
          ],
        })),

      updateWaitingFor: (id, text, person, followUpDate) =>
        set(s => ({
          waitingFor: s.waitingFor.map(w =>
            w.id === id
              ? {...w, text: text.trim(), person: person.trim(), followUpDate}
              : w,
          ),
        })),

      resolveWaitingFor: id =>
        set(s => ({
          waitingFor: s.waitingFor.map(w =>
            w.id === id ? {...w, resolvedAt: Date.now()} : w,
          ),
        })),

      deleteWaitingFor: id =>
        set(s => ({waitingFor: s.waitingFor.filter(w => w.id !== id)})),

      // --- Someday / Maybe ---
      addSomedayItem: text =>
        set(s => ({
          somedayItems: [
            ...s.somedayItems,
            {id: uid(), text: text.trim(), createdAt: Date.now()},
          ],
        })),

      updateSomedayItem: (id, text) =>
        set(s => ({
          somedayItems: s.somedayItems.map(i =>
            i.id === id ? {...i, text: text.trim()} : i,
          ),
        })),

      deleteSomedayItem: id =>
        set(s => ({somedayItems: s.somedayItems.filter(i => i.id !== id)})),

      promoteSomedayToInbox: id => {
        const item = get().somedayItems.find(i => i.id === id);
        if (!item) return;
        set(s => ({
          somedayItems: s.somedayItems.filter(i => i.id !== id),
          items: [
            ...s.items,
            {id: uid(), text: item.text, createdAt: Date.now(), clarified: false},
          ],
        }));
      },

      // --- Weekly Review ---
      completeReview: () => {
        const now = Date.now();
        set(s => ({
          lastReviewedAt: now,
          reviewHistory: [...s.reviewHistory, now],
        }));
      },
    }),
    {
      name: 'offload-gtd',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

// Selectors
export const useUnclarifiedItems = () =>
  useStore(useShallow(s => s.items.filter(i => !i.clarified)));

export const useClarifiedItems = () =>
  useStore(useShallow(s => s.items.filter(i => i.clarified)));

export const useActiveActions = (context?: string) =>
  useStore(useShallow(s =>
    s.actions.filter(
      a => !a.done && (context ? a.context === context : true),
    ),
  ));

export const useCompletedActions = () =>
  useStore(useShallow(s => s.actions.filter(a => a.done)));

export const useActiveProjects = () =>
  useStore(useShallow(s => s.projects.filter(p => !p.done)));

export const useCompletedProjects = () =>
  useStore(useShallow(s => s.projects.filter(p => p.done)));

export const useActiveWaitingFor = () =>
  useStore(useShallow(s => s.waitingFor.filter(w => !w.resolvedAt)));

export const useReviewDue = () => {
  const lastReviewedAt = useStore(s => s.lastReviewedAt);
  if (!lastReviewedAt) return true;
  return Date.now() - lastReviewedAt > 7 * 24 * 60 * 60 * 1000;
};

export const useReviewStreak = () =>
  useStore(s => {
    const history = [...s.reviewHistory].sort((a, b) => b - a);
    if (history.length === 0) return 0;
    let streak = 1;
    for (let i = 1; i < history.length; i++) {
      const daysBetween = (history[i - 1] - history[i]) / (1000 * 60 * 60 * 24);
      if (daysBetween <= 10) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  });

export const useStalledProjectCount = () =>
  useStore(s => {
    const {projects, actions} = s;
    return projects.filter(
      p =>
        !p.done &&
        p.actionIds.filter(id => {
          const a = actions.find(act => act.id === id);
          return a && !a.done;
        }).length === 0,
    ).length;
  });
