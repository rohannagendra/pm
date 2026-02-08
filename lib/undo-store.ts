"use client";

import { create } from "zustand";

export interface UndoAction {
  id: string;
  label: string;
  undo: () => void;
  timestamp: number;
}

interface UndoState {
  stack: UndoAction[];
  push: (action: Omit<UndoAction, "id" | "timestamp">) => void;
  pop: () => UndoAction | undefined;
  remove: (id: string) => void;
  clear: () => void;
}

export const useUndoStore = create<UndoState>()((set, get) => ({
  stack: [],

  push: (action) => {
    const entry: UndoAction = {
      ...action,
      id: Math.random().toString(36).slice(2, 11),
      timestamp: Date.now(),
    };
    set((state) => ({ stack: [...state.stack, entry] }));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().remove(entry.id);
    }, 5000);
  },

  pop: () => {
    const { stack } = get();
    if (stack.length === 0) return undefined;
    const last = stack[stack.length - 1];
    set({ stack: stack.slice(0, -1) });
    return last;
  },

  remove: (id) => {
    set((state) => ({ stack: state.stack.filter((a) => a.id !== id) }));
  },

  clear: () => set({ stack: [] }),
}));
