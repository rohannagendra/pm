"use client";

import React, { useState } from "react";
import {
  useAppStore,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FolderKanban,
  Calendar,
  GripVertical,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { UserAvatar } from "@/components/task-detail-dialog";
import Link from "next/link";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "To Do", color: "bg-slate-100 dark:bg-slate-800/50" },
  {
    status: "in-progress",
    label: "In Progress",
    color: "bg-blue-50 dark:bg-blue-950/30",
  },
  { status: "review", label: "Review", color: "bg-amber-50 dark:bg-amber-950/30" },
  { status: "done", label: "Done", color: "bg-green-50 dark:bg-green-950/30" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#ef4444",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PROJECT_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

// ─── Task Card ──────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  const projects = useAppStore((s) => s.projects);
  const project = projects.find((p) => p.id === task.project);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      className="group relative cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing"
      style={{ borderLeftWidth: 3, borderLeftColor: PRIORITY_COLORS[task.priority] }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug">{task.title}</span>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {project && (
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <span className="text-xs text-muted-foreground">{project.name}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0"
          style={{ borderColor: PRIORITY_COLORS[task.priority], color: PRIORITY_COLORS[task.priority] }}
        >
          {PRIORITY_LABELS[task.priority]}
        </Badge>

        {task.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.dueDate ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : (
            <span />
          )}
          {(task.commentCount ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {task.commentCount}
            </span>
          )}
        </div>
        <UserAvatar user={task.assignee ?? null} size="sm" />
      </div>
    </div>
  );
}

// ─── Add Task Dialog ────────────────────────────────────────────────────────

function AddTaskDialog({
  defaultStatus,
  defaultProject,
}: {
  defaultStatus: TaskStatus;
  defaultProject: string | null;
}) {
  const addTask = useAppStore((s) => s.addTask);
  const projects = useAppStore((s) => s.projects);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>(defaultProject ?? "none");
  const [tagsInput, setTagsInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description,
      status: defaultStatus,
      priority,
      dueDate: dueDate || null,
      project: projectId === "none" ? null : projectId,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      recurrence: null,
      estimatedMinutes: null,
      assigneeId: null,
    });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setProjectId(defaultProject ?? "none");
    setTagsInput("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. frontend, design" />
            </div>
          </div>
          <Button type="submit" className="w-full">Create Task</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Project Dialog ──────────────────────────────────────────────────

function CreateProjectDialog() {
  const addProject = useAppStore((s) => s.addProject);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addProject({ name: name.trim(), description, color });
    setName("");
    setDescription("");
    setColor(PROJECT_COLORS[0]);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "white" : "transparent",
                    boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Create Project</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  label,
  bgColor,
  tasks,
  selectedProject,
}: {
  status: TaskStatus;
  label: string;
  bgColor: string;
  tasks: Task[];
  selectedProject: string | null;
}) {
  const updateTask = useAppStore((s) => s.updateTask);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-xl ${bgColor} ${
        dragOver ? "ring-2 ring-primary/40" : ""
      } transition-shadow snap-center`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
          updateTask(taskId, { status });
        }
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <AddTaskDialog defaultStatus={status} defaultProject={selectedProject} />
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const filteredTasks =
    selectedProject === "all"
      ? tasks
      : tasks.filter((t) => t.project === selectedProject);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Projects</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProject !== "all" && (
            <Link href={`/projects/${selectedProject}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" /> Details
              </Button>
            </Link>
          )}
          <CreateProjectDialog />
        </div>
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-4 md:p-6 -mx-4 md:mx-0 snap-x snap-mandatory md:snap-none">
        {COLUMNS.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.status === col.status);
          return (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              bgColor={col.color}
              tasks={columnTasks}
              selectedProject={selectedProject === "all" ? null : selectedProject}
            />
          );
        })}
      </div>
    </div>
  );
}
