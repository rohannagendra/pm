"use client";

import { create } from "zustand";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  project: string | null;
  tags: string[];
  createdAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  color: string;
}

interface AppState {
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];

  // Hydration
  hydrated: boolean;
  hydrate: () => Promise<void>;
  seedData: () => Promise<void>;

  // Task CRUD
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Project CRUD
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Event CRUD
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  tasks: [],
  projects: [],
  events: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [tasksRes, projectsRes, eventsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
        fetch("/api/events"),
      ]);
      const [tasks, projects, events] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        eventsRes.json(),
      ]);
      set({
        tasks: Array.isArray(tasks) ? tasks : [],
        projects: Array.isArray(projects) ? projects : [],
        events: Array.isArray(events) ? events : [],
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  seedData: async () => {
    await fetch("/api/seed", { method: "POST" });
    set({ hydrated: false });
    await get().hydrate();
  },

  addTask: (task) => {
    const optimistic: Task = {
      ...task,
      id: Math.random().toString(36).slice(2, 11),
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    set((state) => ({ tasks: [optimistic, ...state.tasks] }));
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    })
      .then((res) => res.json())
      .then((created) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === optimistic.id ? created : t)),
        }));
      })
      .catch(() => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== optimistic.id),
        }));
      });
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.status === "done" && !t.completedAt) {
          updated.completedAt = new Date().toISOString();
        }
        if (updates.status && updates.status !== "done") {
          updated.completedAt = null;
        }
        return updated;
      }),
    }));
    const taskInStore = get().tasks.find((t) => t.id === id);
    if (!taskInStore) return;
    const payload: Partial<Task> = { ...updates };
    if (updates.status === "done" && taskInStore.completedAt) {
      payload.completedAt = taskInStore.completedAt;
    }
    if (updates.status && updates.status !== "done") {
      payload.completedAt = null;
    }
    fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  },

  deleteTask: (id) => {
    const prev = get().tasks;
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(() => {
      set({ tasks: prev });
    });
  },

  addProject: (project) => {
    const optimistic: Project = {
      ...project,
      id: Math.random().toString(36).slice(2, 11),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ projects: [...state.projects, optimistic] }));
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    })
      .then((res) => res.json())
      .then((created) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === optimistic.id ? created : p
          ),
        }));
      })
      .catch(() => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== optimistic.id),
        }));
      });
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});
  },

  deleteProject: (id) => {
    const prev = get().projects;
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
    fetch(`/api/projects/${id}`, { method: "DELETE" }).catch(() => {
      set({ projects: prev });
    });
  },

  addEvent: (event) => {
    const optimistic: CalendarEvent = {
      ...event,
      id: Math.random().toString(36).slice(2, 11),
    };
    set((state) => ({ events: [...state.events, optimistic] }));
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
      .then((res) => res.json())
      .then((created) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === optimistic.id ? created : e
          ),
        }));
      })
      .catch(() => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== optimistic.id),
        }));
      });
  },

  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
    fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});
  },

  deleteEvent: (id) => {
    const prev = get().events;
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
    fetch(`/api/events/${id}`, { method: "DELETE" }).catch(() => {
      set({ events: prev });
    });
  },
}));
