"use client";

import { useState, useMemo } from "react";
import {
  useAppStore,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  ArrowUpDown,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
  ListFilter,
  Tag,
  X,
} from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";

// --- Constants ---

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; className: string }
> = {
  urgent: {
    label: "Urgent",
    color: "#ef4444",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  },
  high: {
    label: "High",
    color: "#f97316",
    className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900",
  },
  medium: {
    label: "Medium",
    color: "#eab308",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
  },
  low: {
    label: "Low",
    color: "#22c55e",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  },
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const SORT_OPTIONS = [
  { value: "dueDate", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "createdAt", label: "Created Date" },
  { value: "title", label: "Title" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// --- Empty task form state ---

function emptyForm(): Omit<Task, "id" | "createdAt" | "completedAt"> {
  return {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: null,
    project: null,
    tags: [],
  };
}

// --- Component ---

export default function TasksPage() {
  const { tasks, projects, addTask, updateTask, deleteTask } = useAppStore();

  // UI state
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("dueDate");
  const [sortAsc, setSortAsc] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [tagInput, setTagInput] = useState("");

  // --- Filtering & Sorting ---

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Tab filter
    if (activeTab !== "all") {
      result = result.filter((t) => t.status === activeTab);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Priority filter
    if (filterPriority !== "all") {
      result = result.filter((t) => t.priority === filterPriority);
    }

    // Project filter
    if (filterProject !== "all") {
      result = result.filter((t) => t.project === filterProject);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "dueDate": {
          const da = a.dueDate ?? "9999-12-31";
          const db = b.dueDate ?? "9999-12-31";
          cmp = da.localeCompare(db);
          break;
        }
        case "priority":
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case "createdAt":
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [tasks, activeTab, searchQuery, filterPriority, filterProject, sortBy, sortAsc]);

  // --- Helpers ---

  function openCreate() {
    setEditingTask(null);
    setForm(emptyForm());
    setTagInput("");
    setDialogOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      project: task.project,
      tags: [...task.tags],
    });
    setTagInput("");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingTask) {
      updateTask(editingTask.id, form);
    } else {
      addTask(form);
    }
    setDialogOpen(false);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm({ ...form, tags: [...form.tags, t] });
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  }

  function toggleDone(task: Task) {
    if (task.status === "done") {
      updateTask(task.id, { status: "todo" });
    } else {
      updateTask(task.id, { status: "done" });
    }
  }

  function getProject(id: string | null) {
    return projects.find((p) => p.id === id) ?? null;
  }

  function formatDue(dateStr: string) {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    return format(d, "MMM d, yyyy");
  }

  function isOverdue(task: Task) {
    return (
      task.status !== "done" &&
      task.dueDate !== null &&
      isPast(parseISO(task.dueDate)) &&
      !isToday(parseISO(task.dueDate))
    );
  }

  // --- Tab counts ---

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length };
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

  // --- Render ---

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your tasks across projects.
          </p>
        </div>
        <Button onClick={openCreate} size="default">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {tabCounts[tab.value] ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filter / Sort Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
              <ListFilter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[160px]">
              <ListFilter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="gap-1.5">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => {
                    if (sortBy === opt.value) {
                      setSortAsc(!sortAsc);
                    } else {
                      setSortBy(opt.value);
                      setSortAsc(true);
                    }
                  }}
                >
                  {opt.label}
                  {sortBy === opt.value && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {sortAsc ? "Asc" : "Desc"}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <ListFilter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No tasks found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || filterPriority !== "all" || filterProject !== "all"
              ? "Try adjusting your filters."
              : "Create your first task to get started."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => {
            const proj = getProject(task.project);
            const overdue = isOverdue(task);
            const done = task.status === "done";

            return (
              <Card
                key={task.id}
                className={`group relative flex items-start gap-4 p-4 transition-colors hover:bg-accent/50 ${
                  done ? "opacity-60" : ""
                }`}
              >
                {/* Checkbox */}
                <div className="pt-0.5">
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggleDone(task)}
                    className="h-5 w-5"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span
                      className={`font-medium leading-tight ${
                        done ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Priority badge */}
                    <Badge
                      variant="outline"
                      className={`text-xs ${PRIORITY_CONFIG[task.priority].className}`}
                    >
                      {PRIORITY_CONFIG[task.priority].label}
                    </Badge>

                    {/* Status badge (if not matching tab) */}
                    {activeTab === "all" && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {task.status === "in-progress"
                          ? "In Progress"
                          : task.status === "todo"
                          ? "To Do"
                          : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </Badge>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {/* Due date */}
                    {task.dueDate && (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          overdue ? "text-red-500 font-medium" : ""
                        }`}
                      >
                        {overdue && <AlertCircle className="h-3 w-3" />}
                        <Calendar className="h-3 w-3" />
                        {formatDue(task.dueDate)}
                        {overdue && " (Overdue)"}
                      </span>
                    )}

                    {/* Project */}
                    {proj && (
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: proj.color }}
                        />
                        {proj.name}
                      </span>
                    )}

                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <span className="inline-flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3" />
                        {task.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(task)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteTask(task.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create New Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                placeholder="Add details..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* Priority & Status row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({ ...form, priority: v as TaskPriority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as TaskStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due date & Project row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={form.dueDate ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dueDate: e.target.value || null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={form.project ?? "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, project: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={addTag}
                >
                  Add
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {form.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
