"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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

function genId() {
  return Math.random().toString(36).slice(2, 11);
}

const seedProjects: Project[] = [
  {
    id: "proj-1",
    name: "Website Redesign",
    color: "#6366f1",
    description: "Complete overhaul of the company website with modern design patterns",
    createdAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "proj-2",
    name: "Mobile App",
    color: "#f59e0b",
    description: "Cross-platform mobile application for iOS and Android",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "proj-3",
    name: "API Integration",
    color: "#10b981",
    description: "Third-party API integrations and internal microservices",
    createdAt: "2026-01-20T09:00:00.000Z",
  },
];

const seedTasks: Task[] = [
  {
    id: "task-1",
    title: "Design homepage mockup",
    description: "Create high-fidelity mockups for the new homepage layout",
    status: "done",
    priority: "high",
    dueDate: "2026-02-01",
    project: "proj-1",
    tags: ["design", "ui"],
    createdAt: "2026-01-12T10:00:00.000Z",
    completedAt: "2026-01-30T14:00:00.000Z",
  },
  {
    id: "task-2",
    title: "Implement authentication flow",
    description: "Set up login, registration, and password reset pages",
    status: "in-progress",
    priority: "urgent",
    dueDate: "2026-02-10",
    project: "proj-1",
    tags: ["frontend", "auth"],
    createdAt: "2026-01-15T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "task-3",
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment",
    status: "review",
    priority: "medium",
    dueDate: "2026-02-08",
    project: "proj-3",
    tags: ["devops"],
    createdAt: "2026-01-18T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "task-4",
    title: "Create onboarding screens",
    description: "Design and implement the onboarding flow for new users",
    status: "todo",
    priority: "medium",
    dueDate: "2026-02-15",
    project: "proj-2",
    tags: ["design", "mobile"],
    createdAt: "2026-01-20T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "task-5",
    title: "Write API documentation",
    description: "Document all REST API endpoints with examples",
    status: "todo",
    priority: "low",
    dueDate: "2026-02-20",
    project: "proj-3",
    tags: ["docs"],
    createdAt: "2026-01-22T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "task-6",
    title: "Performance audit",
    description: "Run Lighthouse and optimize Core Web Vitals scores",
    status: "todo",
    priority: "high",
    dueDate: "2026-02-12",
    project: "proj-1",
    tags: ["performance"],
    createdAt: "2026-01-25T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "task-7",
    title: "Push notification system",
    description: "Implement push notifications for iOS and Android",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-02-18",
    project: "proj-2",
    tags: ["mobile", "backend"],
    createdAt: "2026-01-28T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: "task-8",
    title: "Database migration scripts",
    description: "Create migration scripts for the new schema changes",
    status: "done",
    priority: "urgent",
    dueDate: "2026-02-03",
    project: "proj-3",
    tags: ["backend", "database"],
    createdAt: "2026-01-14T10:00:00.000Z",
    completedAt: "2026-02-02T16:00:00.000Z",
  },
];

const seedEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Sprint Planning",
    date: "2026-02-09",
    startTime: "09:00",
    endTime: "10:30",
    description: "Plan tasks for the upcoming sprint",
    color: "#6366f1",
  },
  {
    id: "evt-2",
    title: "Design Review",
    date: "2026-02-11",
    startTime: "14:00",
    endTime: "15:00",
    description: "Review homepage mockups with stakeholders",
    color: "#f59e0b",
  },
  {
    id: "evt-3",
    title: "Team Standup",
    date: "2026-02-07",
    startTime: "09:30",
    endTime: "09:45",
    description: "Daily standup meeting",
    color: "#10b981",
  },
  {
    id: "evt-4",
    title: "Client Demo",
    date: "2026-02-14",
    startTime: "11:00",
    endTime: "12:00",
    description: "Demo progress on website redesign to the client",
    color: "#ef4444",
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tasks: seedTasks,
      projects: seedProjects,
      events: seedEvents,

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: genId(),
              createdAt: new Date().toISOString(),
              completedAt: null,
            },
          ],
        })),

      updateTask: (id, updates) =>
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
        })),

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      addProject: (project) =>
        set((state) => ({
          projects: [
            ...state.projects,
            { ...project, id: genId(), createdAt: new Date().toISOString() },
          ],
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, { ...event, id: genId() }],
        })),

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),
    }),
    { name: "projectflow-store" }
  )
);
