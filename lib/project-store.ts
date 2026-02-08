"use client";

import { create } from "zustand";

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetDate: string;
  createdAt: string;
}

interface ProjectDetailState {
  milestones: Record<string, Milestone[]>;
  loadingMilestones: Record<string, boolean>;

  fetchMilestones: (projectId: string) => Promise<void>;
  addMilestone: (projectId: string, data: Omit<Milestone, "id" | "createdAt" | "projectId">) => Promise<void>;
  updateMilestone: (id: string, projectId: string, data: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (id: string, projectId: string) => Promise<void>;

  // Timezone
  timezone: string;
  setTimezone: (tz: string) => void;
  loadTimezone: () => void;
}

export const useProjectStore = create<ProjectDetailState>()((set, get) => ({
  milestones: {},
  loadingMilestones: {},

  fetchMilestones: async (projectId: string) => {
    set((s) => ({ loadingMilestones: { ...s.loadingMilestones, [projectId]: true } }));
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`);
      const data = await res.json();
      set((s) => ({
        milestones: { ...s.milestones, [projectId]: Array.isArray(data) ? data : [] },
        loadingMilestones: { ...s.loadingMilestones, [projectId]: false },
      }));
    } catch {
      set((s) => ({ loadingMilestones: { ...s.loadingMilestones, [projectId]: false } }));
    }
  },

  addMilestone: async (projectId, data) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      set((s) => ({
        milestones: {
          ...s.milestones,
          [projectId]: [...(s.milestones[projectId] || []), created],
        },
      }));
    } catch {}
  },

  updateMilestone: async (id, projectId, data) => {
    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      set((s) => ({
        milestones: {
          ...s.milestones,
          [projectId]: (s.milestones[projectId] || []).map((m) =>
            m.id === id ? updated : m
          ),
        },
      }));
    } catch {}
  },

  deleteMilestone: async (id, projectId) => {
    try {
      await fetch(`/api/milestones/${id}`, { method: "DELETE" });
      set((s) => ({
        milestones: {
          ...s.milestones,
          [projectId]: (s.milestones[projectId] || []).filter((m) => m.id !== id),
        },
      }));
    } catch {}
  },

  timezone: "UTC",
  setTimezone: (tz: string) => {
    set({ timezone: tz });
    if (typeof window !== "undefined") {
      localStorage.setItem("projectflow-timezone", tz);
    }
  },
  loadTimezone: () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("projectflow-timezone");
      if (saved) {
        set({ timezone: saved });
      } else {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        set({ timezone: detected });
      }
    }
  },
}));
