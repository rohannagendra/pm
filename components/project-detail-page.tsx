"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppStore, type Task, type TaskStatus, type TaskPriority } from "@/lib/store";
import { useProjectStore, type Milestone } from "@/lib/project-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Target,
  Calendar,
  BarChart3,
  ListTodo,
  Download,
  FileText,
} from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import GanttChart from "@/components/gantt-chart";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { tasks, projects, updateProject, deleteProject, updateTask, hydrate, hydrated } = useAppStore();
  const { milestones, fetchMilestones, addMilestone, updateMilestone, deleteMilestone } = useProjectStore();

  const [activeView, setActiveView] = useState<"tasks" | "gantt" | "milestones">("tasks");
  const [editOpen, setEditOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [mForm, setMForm] = useState({ name: "", description: "", targetDate: "" });
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    fetchMilestones(projectId);
  }, [projectId, fetchMilestones]);

  const project = projects.find((p) => p.id === projectId);
  const projectMilestones = milestones[projectId] || [];

  const projectTasks = useMemo(() => {
    let result = tasks.filter((t) => t.project === projectId);
    if (filterStatus !== "all") {
      result = result.filter((t) => t.status === filterStatus);
    }
    result.sort((a, b) => {
      if (sortBy === "dueDate") {
        const da = a.dueDate ?? "9999-12-31";
        const db = b.dueDate ?? "9999-12-31";
        return da.localeCompare(db);
      }
      const po: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (po[a.priority] ?? 2) - (po[b.priority] ?? 2);
    });
    return result;
  }, [tasks, projectId, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const all = tasks.filter((t) => t.project === projectId);
    const done = all.filter((t) => t.status === "done").length;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = all.filter((t) => {
      if (!t.dueDate || t.status === "done") return false;
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d < now;
    }).length;
    const byStatus: Record<string, number> = { todo: 0, "in-progress": 0, review: 0, done: 0 };
    all.forEach((t) => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
    return {
      total: all.length,
      done,
      pct: all.length > 0 ? Math.round((done / all.length) * 100) : 0,
      overdue,
      byStatus,
    };
  }, [tasks, projectId]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  function openEditProject() {
    setEditName(project!.name);
    setEditDesc(project!.description);
    setEditColor(project!.color);
    setEditOpen(true);
  }

  function saveProject() {
    updateProject(projectId, { name: editName, description: editDesc, color: editColor });
    setEditOpen(false);
  }

  function handleDeleteProject() {
    if (confirm("Delete this project? Tasks will be unlinked.")) {
      deleteProject(projectId);
      router.push("/projects");
    }
  }

  function openMilestoneCreate() {
    setEditingMilestone(null);
    setMForm({ name: "", description: "", targetDate: "" });
    setMilestoneDialogOpen(true);
  }

  function openMilestoneEdit(m: Milestone) {
    setEditingMilestone(m);
    setMForm({ name: m.name, description: m.description, targetDate: m.targetDate });
    setMilestoneDialogOpen(true);
  }

  function saveMilestone() {
    if (!mForm.name.trim() || !mForm.targetDate) return;
    if (editingMilestone) {
      updateMilestone(editingMilestone.id, projectId, mForm);
    } else {
      addMilestone(projectId, mForm);
    }
    setMilestoneDialogOpen(false);
  }

  function getMilestoneProgress(m: Milestone) {
    const mTasks = tasks.filter((t) => t.project === projectId && (t as Task & { milestoneId?: string }).milestoneId === m.id);
    if (mTasks.length === 0) return { total: 0, done: 0, pct: 0 };
    const done = mTasks.filter((t) => t.status === "done").length;
    return { total: mTasks.length, done, pct: Math.round((done / mTasks.length) * 100) };
  }

  function exportProjectCSV() {
    const allTasks = tasks.filter((t) => t.project === projectId);
    const headers = "Title,Status,Priority,Due Date,Tags,Created\n";
    const rows = allTasks.map((t) =>
      `"${t.title}","${t.status}","${t.priority}","${t.dueDate || ""}","${t.tags.join(", ")}","${t.createdAt}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project!.name.replace(/\s+/g, "-").toLowerCase()}-tasks.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportProjectPDF() {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const allTasks = tasks.filter((t) => t.project === projectId);
    printWin.document.write(`<!DOCTYPE html><html><head><title>${project!.name} Report</title>
    <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:800px;margin:0 auto}
    h1{color:#333}table{width:100%;border-collapse:collapse;margin-top:1rem}
    th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:14px}
    th{background:#f5f5f5}tr:nth-child(even){background:#fafafa}
    .stats{display:flex;gap:2rem;margin:1rem 0}.stat{text-align:center}
    .stat-num{font-size:2rem;font-weight:bold}.stat-label{color:#666;font-size:0.875rem}
    @media print{body{padding:0}}</style></head><body>
    <h1>${project!.name}</h1>
    <p>${project!.description || "No description"}</p>
    <div class="stats">
      <div class="stat"><div class="stat-num">${stats.total}</div><div class="stat-label">Total Tasks</div></div>
      <div class="stat"><div class="stat-num">${stats.pct}%</div><div class="stat-label">Complete</div></div>
      <div class="stat"><div class="stat-num">${stats.overdue}</div><div class="stat-label">Overdue</div></div>
    </div>
    <table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Due Date</th></tr></thead><tbody>
    ${allTasks.map((t) => `<tr><td>${t.title}</td><td>${t.status}</td><td>${t.priority}</td><td>${t.dueDate || "-"}</td></tr>`).join("")}
    </tbody></table>
    <script>window.print();</script></body></html>`);
    printWin.document.close();
  }

  const PROJECT_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: project.color }} />
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportProjectCSV}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportProjectPDF}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={openEditProject}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.pct}%</div>
            <p className="text-xs text-muted-foreground">Complete</p>
            <Progress value={stats.pct} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2 text-sm">
              {Object.entries(stats.byStatus).map(([s, c]) => (
                <span key={s} className="text-muted-foreground">
                  {STATUS_LABELS[s as TaskStatus]}: <strong>{c}</strong>
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">By Status</p>
          </CardContent>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="px-6">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
          <TabsList>
            <TabsTrigger value="tasks" className="gap-1.5">
              <ListTodo className="h-4 w-4" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="gantt" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Gantt
            </TabsTrigger>
            <TabsTrigger value="milestones" className="gap-1.5">
              <Target className="h-4 w-4" /> Milestones
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeView === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "dueDate" | "priority")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {projectTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks in this project</p>
            ) : (
              <div className="space-y-2">
                {projectTasks.map((task) => {
                  const overdue = task.status !== "done" && task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
                  return (
                    <Card key={task.id} className="p-3 flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </span>
                        <div className="flex gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">{STATUS_LABELS[task.status]}</Badge>
                          {task.dueDate && (
                            <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? "text-red-500" : "text-muted-foreground"}`}>
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(task.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeView === "gantt" && (
          <GanttChart tasks={projectTasks} />
        )}

        {activeView === "milestones" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={openMilestoneCreate}>
                <Plus className="h-4 w-4 mr-1" /> Add Milestone
              </Button>
            </div>
            {projectMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No milestones yet</p>
            ) : (
              <div className="space-y-3">
                {projectMilestones.map((m) => {
                  const prog = getMilestoneProgress(m);
                  const isPastDue = isPast(parseISO(m.targetDate)) && !isToday(parseISO(m.targetDate));
                  return (
                    <Card key={m.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="font-medium">{m.name}</span>
                            {isPastDue && prog.pct < 100 && (
                              <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                            )}
                          </div>
                          {m.description && (
                            <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(m.targetDate), "MMM d, yyyy")}
                            </span>
                            <span>{prog.done}/{prog.total} tasks</span>
                          </div>
                          <Progress value={prog.pct} className="h-1.5 mt-2" />
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openMilestoneEdit(m)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMilestone(m.id, projectId)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditColor(c)}
                    className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: editColor === c ? "white" : "transparent",
                      boxShadow: editColor === c ? `0 0 0 2px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveProject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={mForm.name} onChange={(e) => setMForm({ ...mForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={mForm.description} onChange={(e) => setMForm({ ...mForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" value={mForm.targetDate} onChange={(e) => setMForm({ ...mForm, targetDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveMilestone} disabled={!mForm.name.trim() || !mForm.targetDate}>
              {editingMilestone ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
