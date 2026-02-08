"use client";

import { create } from "zustand";
import { addDays, addWeeks, addMonths } from "date-fns";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  dependsOn: Task;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  minutes: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  taskId: string;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

export interface Recurrence {
  pattern: "daily" | "weekly" | "monthly" | "custom";
  interval: number;
  endDate?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: AppUser;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityId: string | null;
  entityType: string | null;
  read: boolean;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string;
  createdAt: string;
  user: AppUser | null;
}

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
  recurrence: string | null;
  estimatedMinutes: number | null;
  assigneeId: string | null;
  assignee: AppUser | null;
  commentCount: number;
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  timeEntries: TimeEntry[];
  attachments: FileAttachment[];
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
  recurrence?: string | null;
  timezone?: string | null;
}

interface AppState {
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];
  users: AppUser[];
  notifications: Notification[];
  activities: ActivityLogEntry[];

  // Hydration
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refreshData: () => Promise<void>;
  seedData: () => Promise<void>;

  // Users
  fetchUsers: () => Promise<void>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Activity
  fetchActivities: () => Promise<void>;

  // Task CRUD
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedAt" | "subtasks" | "dependencies" | "timeEntries" | "attachments" | "assignee" | "commentCount">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Subtask CRUD
  addSubtask: (taskId: string, title: string) => Promise<void>;
  updateSubtask: (id: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (id: string, taskId: string) => void;

  // Dependencies
  addDependency: (taskId: string, dependsOnId: string) => Promise<void>;
  removeDependency: (taskId: string, dependsOnId: string) => void;

  // Time entries
  addTimeEntry: (taskId: string, entry: { userId: string; minutes: number; date: string; note?: string }) => Promise<void>;
  deleteTimeEntry: (id: string, taskId: string) => void;

  // Attachments
  addAttachment: (taskId: string, file: File) => Promise<void>;
  deleteAttachment: (id: string, taskId: string) => void;

  // Timer
  activeTimer: { taskId: string; startedAt: number } | null;
  startTimer: (taskId: string) => void;
  stopTimer: (userId: string) => void;

  // Bulk operations
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  bulkDeleteTasks: (ids: string[]) => void;

  // Project CRUD
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Event CRUD
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
}

function getNextDueDate(currentDue: string, recurrence: Recurrence): string {
  const date = new Date(currentDue);
  const interval = recurrence.interval || 1;
  let next: Date;
  switch (recurrence.pattern) {
    case "daily":
      next = addDays(date, interval);
      break;
    case "weekly":
      next = addWeeks(date, interval);
      break;
    case "monthly":
      next = addMonths(date, interval);
      break;
    case "custom":
      next = addDays(date, interval);
      break;
    default:
      next = addDays(date, 1);
  }
  return next.toISOString().split("T")[0];
}

export const useAppStore = create<AppState>()((set, get) => ({
  tasks: [],
  projects: [],
  events: [],
  users: [],
  notifications: [],
  activities: [],
  hydrated: false,
  activeTimer: null,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [tasksRes, projectsRes, eventsRes, usersRes, notifRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
        fetch("/api/events"),
        fetch("/api/users"),
        fetch("/api/notifications"),
      ]);
      const [tasks, projects, events, users, notifications] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        eventsRes.json(),
        usersRes.json().catch(() => []),
        notifRes.json().catch(() => []),
      ]);
      set({
        tasks: Array.isArray(tasks) ? tasks : [],
        projects: Array.isArray(projects) ? projects : [],
        events: Array.isArray(events) ? events : [],
        users: Array.isArray(users) ? users : [],
        notifications: Array.isArray(notifications) ? notifications : [],
        hydrated: true,
      });

      // Start 30-second polling for real-time updates
      setInterval(() => {
        get().refreshData();
      }, 30000);
    } catch {
      set({ hydrated: true });
    }
  },

  refreshData: async () => {
    try {
      const [tasksRes, projectsRes, eventsRes, notifRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
        fetch("/api/events"),
        fetch("/api/notifications"),
      ]);
      const [tasks, projects, events, notifications] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        eventsRes.json(),
        notifRes.json().catch(() => []),
      ]);
      set({
        tasks: Array.isArray(tasks) ? tasks : [],
        projects: Array.isArray(projects) ? projects : [],
        events: Array.isArray(events) ? events : [],
        notifications: Array.isArray(notifications) ? notifications : [],
      });
    } catch {}
  },

  seedData: async () => {
    await fetch("/api/seed", { method: "POST" });
    set({ hydrated: false });
    await get().hydrate();
  },

  fetchUsers: async () => {
    try {
      const res = await fetch("/api/users");
      const users = await res.json();
      set({ users: Array.isArray(users) ? users : [] });
    } catch {}
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch("/api/notifications");
      const notifications = await res.json();
      set({ notifications: Array.isArray(notifications) ? notifications : [] });
    } catch {}
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    }).catch(() => {});
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    fetch("/api/notifications/read-all", { method: "PUT" }).catch(() => {});
  },

  fetchActivities: async () => {
    try {
      const res = await fetch("/api/activity?limit=30");
      const activities = await res.json();
      set({ activities: Array.isArray(activities) ? activities : [] });
    } catch {}
  },

  addTask: (task) => {
    const optimistic: Task = {
      ...task,
      id: Math.random().toString(36).slice(2, 11),
      createdAt: new Date().toISOString(),
      completedAt: null,
      assigneeId: task.assigneeId ?? null,
      assignee: task.assigneeId ? get().users.find((u) => u.id === task.assigneeId) ?? null : null,
      commentCount: 0,
      subtasks: [],
      dependencies: [],
      timeEntries: [],
      attachments: [],
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
          tasks: state.tasks.map((t) => (t.id === optimistic.id ? { ...optimistic, ...created } : t)),
        }));
      })
      .catch(() => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== optimistic.id),
        }));
      });
  },

  updateTask: (id, updates) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    // Check if completing a recurring task
    const isCompleting = updates.status === "done" && task.status !== "done";
    const hasRecurrence = task.recurrence;

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

    const payload: Partial<Task> = { ...updates };
    const taskInStore = get().tasks.find((t) => t.id === id);
    if (updates.status === "done" && taskInStore?.completedAt) {
      payload.completedAt = taskInStore.completedAt;
    }
    if (updates.status && updates.status !== "done") {
      payload.completedAt = null;
    }
    // Don't send relation arrays to the API
    delete payload.subtasks;
    delete payload.dependencies;
    delete payload.timeEntries;
    delete payload.attachments;

    fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});

    // Auto-create next recurring task instance
    if (isCompleting && hasRecurrence && task.dueDate) {
      try {
        const rec: Recurrence = JSON.parse(hasRecurrence);
        const nextDue = getNextDueDate(task.dueDate, rec);
        if (!rec.endDate || nextDue <= rec.endDate) {
          get().addTask({
            title: task.title,
            description: task.description,
            status: "todo",
            priority: task.priority,
            dueDate: nextDue,
            project: task.project,
            tags: [...task.tags],
            recurrence: task.recurrence,
            estimatedMinutes: task.estimatedMinutes,
            assigneeId: task.assigneeId,
          });
        }
      } catch {
        // invalid recurrence JSON, skip
      }
    }
  },

  deleteTask: (id) => {
    const prev = get().tasks;
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(() => {
      set({ tasks: prev });
    });
  },

  // Subtasks
  addSubtask: async (taskId, title) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const subtask = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t
        ),
      }));
    } catch {}
  },

  updateSubtask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
    }));
    fetch(`/api/subtasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});
  },

  deleteSubtask: (id, taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== id) } : t
      ),
    }));
    fetch(`/api/subtasks/${id}`, { method: "DELETE" }).catch(() => {});
  },

  // Dependencies
  addDependency: async (taskId, dependsOnId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dependsOnId }),
      });
      const dep = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, dependencies: [...t.dependencies, dep] } : t
        ),
      }));
    } catch {}
  },

  removeDependency: (taskId, dependsOnId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, dependencies: t.dependencies.filter((d) => d.dependsOnId !== dependsOnId) }
          : t
      ),
    }));
    fetch(`/api/tasks/${taskId}/dependencies?dependsOnId=${dependsOnId}`, {
      method: "DELETE",
    }).catch(() => {});
  },

  // Time entries
  addTimeEntry: async (taskId, entry) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/time-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const created = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, timeEntries: [created, ...t.timeEntries] } : t
        ),
      }));
    } catch {}
  },

  deleteTimeEntry: (id, taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, timeEntries: t.timeEntries.filter((e) => e.id !== id) } : t
      ),
    }));
    fetch(`/api/time-entries/${id}`, { method: "DELETE" }).catch(() => {});
  },

  // Attachments
  addAttachment: async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      });
      const attachment = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, attachments: [attachment, ...t.attachments] } : t
        ),
      }));
    } catch {}
  },

  deleteAttachment: (id, taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, attachments: t.attachments.filter((a) => a.id !== id) } : t
      ),
    }));
    fetch(`/api/attachments/${id}`, { method: "DELETE" }).catch(() => {});
  },

  // Timer
  startTimer: (taskId) => {
    set({ activeTimer: { taskId, startedAt: Date.now() } });
  },

  stopTimer: (userId) => {
    const timer = get().activeTimer;
    if (!timer) return;
    const minutes = Math.max(1, Math.round((Date.now() - timer.startedAt) / 60000));
    const date = new Date().toISOString().split("T")[0];
    get().addTimeEntry(timer.taskId, { userId, minutes, date, note: "Timer" });
    set({ activeTimer: null });
  },

  // Bulk operations
  bulkUpdateTasks: (ids, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (!ids.includes(t.id)) return t;
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
    const payload: Partial<Task> = { ...updates };
    delete payload.subtasks;
    delete payload.dependencies;
    delete payload.timeEntries;
    delete payload.attachments;
    for (const id of ids) {
      fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  },

  bulkDeleteTasks: (ids) => {
    const prev = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => !ids.includes(t.id)),
    }));
    Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, { method: "DELETE" }))).catch(() => {
      set({ tasks: prev });
    });
  },

  // Projects
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
