"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  useAppStore,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type Recurrence,
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
import { Progress } from "@/components/ui/progress";
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
  Lock,
  Repeat,
  Clock,
  Play,
  Square,
  Paperclip,
  Upload,
  Download,
  Image,
  FileText,
  CheckSquare,
} from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";
import { TaskDetailDialog, UserAvatar } from "@/components/task-detail-dialog";
import { MessageSquare, User } from "lucide-react";

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

type TaskForm = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  project: string | null;
  tags: string[];
  recurrence: string | null;
  estimatedMinutes: number | null;
  assigneeId: string | null;
};

function emptyForm(): TaskForm {
  return {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: null,
    project: null,
    tags: [],
    recurrence: null,
    estimatedMinutes: null,
    assigneeId: null,
  };
}

// --- Component ---

export default function TasksPage() {
  const {
    tasks,
    projects,
    users,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addDependency,
    removeDependency,
    addTimeEntry,
    deleteTimeEntry,
    addAttachment,
    deleteAttachment,
    activeTimer,
    startTimer,
    stopTimer,
    bulkUpdateTasks,
    bulkDeleteTasks,
  } = useAppStore();

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
  const [form, setForm] = useState<TaskForm>(emptyForm());
  const [tagInput, setTagInput] = useState("");

  // Subtask input
  const [subtaskInput, setSubtaskInput] = useState("");

  // Dependency picker
  const [depSearchQuery, setDepSearchQuery] = useState("");

  // Time entry form
  const [timeMinutes, setTimeMinutes] = useState("");
  const [timeNote, setTimeNote] = useState("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Blocked task warning
  const [blockedWarningTask, setBlockedWarningTask] = useState<Task | null>(null);

  // Assignee filter
  const [filterAssignee, setFilterAssignee] = useState<string>("all");

  // Task detail dialog
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Filtering & Sorting ---

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (activeTab !== "all") {
      result = result.filter((t) => t.status === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (filterPriority !== "all") {
      result = result.filter((t) => t.priority === filterPriority);
    }

    if (filterProject !== "all") {
      result = result.filter((t) => t.project === filterProject);
    }

    if (filterAssignee === "me") {
      result = result.filter((t) => t.assigneeId != null);
    } else if (filterAssignee === "unassigned") {
      result = result.filter((t) => !t.assigneeId);
    } else if (filterAssignee !== "all") {
      result = result.filter((t) => t.assigneeId === filterAssignee);
    }

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
  }, [tasks, activeTab, searchQuery, filterPriority, filterProject, filterAssignee, sortBy, sortAsc]);

  // --- Helpers ---

  function isBlocked(task: Task): boolean {
    return task.dependencies?.some((d) => d.dependsOn && d.dependsOn.status !== "done") ?? false;
  }

  function openCreate() {
    setEditingTask(null);
    setForm(emptyForm());
    setTagInput("");
    setSubtaskInput("");
    setDepSearchQuery("");
    setTimeMinutes("");
    setTimeNote("");
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
      recurrence: task.recurrence,
      estimatedMinutes: task.estimatedMinutes,
      assigneeId: task.assigneeId,
    });
    setTagInput("");
    setSubtaskInput("");
    setDepSearchQuery("");
    setTimeMinutes("");
    setTimeNote("");
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
      if (isBlocked(task)) {
        setBlockedWarningTask(task);
        return;
      }
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

  function getRecurrenceLabel(recStr: string | null): string | null {
    if (!recStr) return null;
    try {
      const rec: Recurrence = JSON.parse(recStr);
      if (rec.interval === 1) return rec.pattern.charAt(0).toUpperCase() + rec.pattern.slice(1);
      return `Every ${rec.interval} ${rec.pattern === "daily" ? "days" : rec.pattern === "weekly" ? "weeks" : rec.pattern === "monthly" ? "months" : "days"}`;
    } catch {
      return null;
    }
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function handleAddSubtask() {
    if (!editingTask || !subtaskInput.trim()) return;
    addSubtask(editingTask.id, subtaskInput.trim());
    setSubtaskInput("");
  }

  function handleAddTimeEntry() {
    if (!editingTask || !timeMinutes) return;
    const mins = parseInt(timeMinutes);
    if (isNaN(mins) || mins <= 0) return;
    addTimeEntry(editingTask.id, {
      userId: "current",
      minutes: mins,
      date: new Date().toISOString().split("T")[0],
      note: timeNote,
    });
    setTimeMinutes("");
    setTimeNote("");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editingTask || !e.target.files?.length) return;
    for (const file of Array.from(e.target.files)) {
      addAttachment(editingTask.id, file);
    }
    e.target.value = "";
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // Recurrence form helpers
  function getRecurrence(): Recurrence | null {
    if (!form.recurrence) return null;
    try { return JSON.parse(form.recurrence); } catch { return null; }
  }

  function setRecurrence(rec: Recurrence | null) {
    setForm({ ...form, recurrence: rec ? JSON.stringify(rec) : null });
  }

  // --- Tab counts ---

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length };
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

  // Dep search results
  const depResults = useMemo(() => {
    if (!editingTask || !depSearchQuery.trim()) return [];
    const q = depSearchQuery.toLowerCase();
    const existingDepIds = new Set(editingTask.dependencies?.map((d) => d.dependsOnId) ?? []);
    return tasks.filter(
      (t) =>
        t.id !== editingTask.id &&
        !existingDepIds.has(t.id) &&
        t.title.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [tasks, editingTask, depSearchQuery]);

  // Current task data (live from store)
  const currentTask = editingTask ? tasks.find((t) => t.id === editingTask.id) ?? editingTask : null;

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

          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-[160px]">
              <User className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="me">Assigned to me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
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
            const blocked = isBlocked(task);
            const subtasksDone = task.subtasks?.filter((s) => s.completed).length ?? 0;
            const subtasksTotal = task.subtasks?.length ?? 0;
            const totalTime = task.timeEntries?.reduce((sum, e) => sum + e.minutes, 0) ?? 0;
            const recLabel = getRecurrenceLabel(task.recurrence);
            const isTimerActive = activeTimer?.taskId === task.id;

            return (
              <Card
                key={task.id}
                className={`group relative flex items-start gap-4 p-4 transition-colors hover:bg-accent/50 ${
                  done ? "opacity-60" : ""
                } ${blocked ? "border-yellow-400 dark:border-yellow-600" : ""}`}
              >
                {/* Bulk select checkbox */}
                <div className="pt-0.5 flex flex-col gap-1">
                  <Checkbox
                    checked={selectedIds.has(task.id)}
                    onCheckedChange={() => toggleSelect(task.id)}
                    className="h-4 w-4"
                  />
                </div>

                {/* Done checkbox */}
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
                    {blocked && <Lock className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />}
                    <button
                      className={`font-medium leading-tight text-left hover:underline ${
                        done ? "line-through text-muted-foreground" : ""
                      }`}
                      onClick={() => setDetailTask(task)}
                    >
                      {task.title}
                    </button>

                    <Badge
                      variant="outline"
                      className={`text-xs ${PRIORITY_CONFIG[task.priority].className}`}
                    >
                      {PRIORITY_CONFIG[task.priority].label}
                    </Badge>

                    {activeTab === "all" && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {task.status === "in-progress"
                          ? "In Progress"
                          : task.status === "todo"
                          ? "To Do"
                          : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </Badge>
                    )}

                    {recLabel && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Repeat className="h-3 w-3" />
                        {recLabel}
                      </Badge>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
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

                    {proj && (
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: proj.color }}
                        />
                        {proj.name}
                      </span>
                    )}

                    {subtasksTotal > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        {subtasksDone}/{subtasksTotal}
                      </span>
                    )}

                    {totalTime > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {totalTime}m
                      </span>
                    )}

                    {(task.commentCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {task.commentCount}
                      </span>
                    )}

                    {(task.attachments?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {task.attachments.length}
                      </span>
                    )}

                    {task.assignee && (
                      <span className="inline-flex items-center gap-1">
                        <UserAvatar user={task.assignee} size="sm" />
                        <span className="truncate max-w-[80px]">{task.assignee.name}</span>
                      </span>
                    )}

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

                  {/* Subtask progress bar */}
                  {subtasksTotal > 0 && (
                    <Progress value={(subtasksDone / subtasksTotal) * 100} className="h-1.5" />
                  )}
                </div>

                {/* Timer button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${isTimerActive ? "text-red-500" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                  onClick={() => {
                    if (isTimerActive) {
                      stopTimer("current");
                    } else {
                      startTimer(task.id);
                    }
                  }}
                >
                  {isTimerActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

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

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background border rounded-lg shadow-lg p-3">
          <span className="text-sm font-medium mr-2">{selectedIds.size} selected</span>
          <Select onValueChange={(v) => { bulkUpdateTasks(Array.from(selectedIds), { status: v as TaskStatus }); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Set Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => { bulkUpdateTasks(Array.from(selectedIds), { priority: v as TaskPriority }); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Set Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => { bulkUpdateTasks(Array.from(selectedIds), { project: v === "none" ? null : v }); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Set Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { bulkDeleteTasks(Array.from(selectedIds)); setSelectedIds(new Set()); }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Blocked task warning dialog */}
      <Dialog open={!!blockedWarningTask} onOpenChange={() => setBlockedWarningTask(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Task is Blocked</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This task has unfinished dependencies. Complete them first, or force-complete anyway.
          </p>
          <div className="text-sm space-y-1">
            {blockedWarningTask?.dependencies?.filter((d) => d.dependsOn?.status !== "done").map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-yellow-500" />
                <span>{d.dependsOn?.title ?? "Unknown task"}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockedWarningTask(null)}>Cancel</Button>
            <Button onClick={() => {
              if (blockedWarningTask) updateTask(blockedWarningTask.id, { status: "done" });
              setBlockedWarningTask(null);
            }}>Complete Anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            {/* Assignee */}
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={form.assigneeId ?? "none"}
                onValueChange={(v) => setForm({ ...form, assigneeId: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <Label>Recurrence</Label>
              <div className="flex gap-2">
                <Select
                  value={getRecurrence()?.pattern ?? "none"}
                  onValueChange={(v) => {
                    if (v === "none") {
                      setRecurrence(null);
                    } else {
                      setRecurrence({ pattern: v as Recurrence["pattern"], interval: getRecurrence()?.interval ?? 1 });
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {getRecurrence() && (
                  <Input
                    type="number"
                    min={1}
                    className="w-[80px]"
                    value={getRecurrence()?.interval ?? 1}
                    onChange={(e) => {
                      const rec = getRecurrence();
                      if (rec) setRecurrence({ ...rec, interval: parseInt(e.target.value) || 1 });
                    }}
                  />
                )}
              </div>
            </div>

            {/* Estimated time */}
            <div className="space-y-2">
              <Label>Estimated Time (minutes)</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.estimatedMinutes ?? ""}
                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value ? parseInt(e.target.value) : null })}
              />
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

            {/* === Edit-only sections === */}
            {editingTask && currentTask && (
              <>
                <Separator />

                {/* Subtasks */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Subtasks
                    {currentTask.subtasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({currentTask.subtasks.filter((s) => s.completed).length}/{currentTask.subtasks.length})
                      </span>
                    )}
                  </Label>
                  {currentTask.subtasks.length > 0 && (
                    <Progress
                      value={currentTask.subtasks.length > 0 ? (currentTask.subtasks.filter((s) => s.completed).length / currentTask.subtasks.length) * 100 : 0}
                      className="h-1.5"
                    />
                  )}
                  <div className="space-y-1">
                    {currentTask.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2 group/sub">
                        <Checkbox
                          checked={sub.completed}
                          onCheckedChange={(checked) => updateSubtask(sub.id, { completed: !!checked })}
                          className="h-4 w-4"
                        />
                        <span className={`text-sm flex-1 ${sub.completed ? "line-through text-muted-foreground" : ""}`}>
                          {sub.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover/sub:opacity-100"
                          onClick={() => deleteSubtask(sub.id, editingTask.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add subtask..."
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); } }}
                      className="text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleAddSubtask} disabled={!subtaskInput.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Dependencies */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Blocked By
                  </Label>
                  {currentTask.dependencies?.length > 0 && (
                    <div className="space-y-1">
                      {currentTask.dependencies.map((dep) => (
                        <div key={dep.id} className="flex items-center gap-2 text-sm">
                          <Badge variant={dep.dependsOn?.status === "done" ? "secondary" : "outline"} className="text-xs">
                            {dep.dependsOn?.status === "done" ? "Done" : dep.dependsOn?.status ?? "Unknown"}
                          </Badge>
                          <span className="flex-1">{dep.dependsOn?.title ?? "Unknown task"}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeDependency(editingTask.id, dep.dependsOnId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      placeholder="Search tasks to add dependency..."
                      value={depSearchQuery}
                      onChange={(e) => setDepSearchQuery(e.target.value)}
                      className="text-sm"
                    />
                    {depResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                        {depResults.map((t) => (
                          <button
                            key={t.id}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => {
                              addDependency(editingTask.id, t.id);
                              setDepSearchQuery("");
                            }}
                          >
                            <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                            {t.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Time Tracking */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Tracking
                    {currentTask.timeEntries.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        (Total: {currentTask.timeEntries.reduce((s, e) => s + e.minutes, 0)}m)
                      </span>
                    )}
                  </Label>
                  {/* Timer */}
                  <div className="flex items-center gap-2">
                    {activeTimer?.taskId === editingTask.id ? (
                      <Button variant="destructive" size="sm" onClick={() => stopTimer("current")}>
                        <Square className="h-4 w-4 mr-1" />
                        Stop Timer
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => startTimer(editingTask.id)} disabled={!!activeTimer}>
                        <Play className="h-4 w-4 mr-1" />
                        Start Timer
                      </Button>
                    )}
                  </div>
                  {/* Manual entry */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Minutes"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                      className="w-[80px] text-sm"
                    />
                    <Input
                      placeholder="Note (optional)"
                      value={timeNote}
                      onChange={(e) => setTimeNote(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleAddTimeEntry} disabled={!timeMinutes}>
                      Add
                    </Button>
                  </div>
                  {/* Entries list */}
                  {currentTask.timeEntries.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {currentTask.timeEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-2 text-xs group/te">
                          <span className="font-medium">{entry.minutes}m</span>
                          <span className="text-muted-foreground">{entry.date}</span>
                          {entry.note && <span className="text-muted-foreground truncate flex-1">{entry.note}</span>}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover/te:opacity-100"
                            onClick={() => deleteTimeEntry(entry.id, editingTask.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* File Attachments */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!editingTask) return;
                      for (const file of Array.from(e.dataTransfer.files)) {
                        addAttachment(editingTask.id, file);
                      }
                    }}
                  >
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">
                      Drop files here or click to browse
                    </p>
                  </div>
                  {currentTask.attachments.length > 0 && (
                    <div className="space-y-2">
                      {currentTask.attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2 text-sm group/att">
                          {att.mimetype.startsWith("image/") ? (
                            <Image className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate flex-1">{att.filename}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(att.size)}</span>
                          <a
                            href={att.filepath}
                            download={att.filename}
                            className="opacity-0 group-hover/att:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover/att:opacity-100"
                            onClick={() => deleteAttachment(att.id, editingTask.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
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

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={detailTask}
        open={!!detailTask}
        onOpenChange={(open) => { if (!open) setDetailTask(null); }}
      />
    </div>
  );
}
