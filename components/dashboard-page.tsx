"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysFromNow(dateStr: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeTime(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusColors: Record<string, string> = {
  todo: "bg-slate-400",
  "in-progress": "bg-blue-500",
  review: "bg-amber-500",
  done: "bg-emerald-500",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "In Review",
  done: "Done",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-600",
};

export default function DashboardPage() {
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const addTask = useAppStore((s) => s.addTask);
  const addProject = useAppStore((s) => s.addProject);
  const addEvent = useAppStore((s) => s.addEvent);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === "done") return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < now;
    }).length;
    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekOut = new Date(now);
    weekOut.setDate(weekOut.getDate() + 7);
    return tasks
      .filter((t) => {
        if (!t.dueDate || t.status === "done") return false;
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        return due >= now && due <= weekOut;
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      );
  }, [tasks]);

  const recentActivity = useMemo(() => {
    return [...tasks]
      .map((t) => ({
        ...t,
        activityDate: t.completedAt || t.createdAt,
        activityType: t.completedAt ? ("completed" as const) : ("created" as const),
      }))
      .sort(
        (a, b) =>
          new Date(b.activityDate).getTime() -
          new Date(a.activityDate).getTime()
      )
      .slice(0, 6);
  }, [tasks]);

  const projectProgress = useMemo(() => {
    return projects.map((p) => {
      const projectTasks = tasks.filter((t) => t.project === p.id);
      const done = projectTasks.filter((t) => t.status === "done").length;
      return {
        ...p,
        total: projectTasks.length,
        done,
        pct: projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0,
      };
    });
  }, [tasks, projects]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      todo: 0,
      "in-progress": 0,
      review: 0,
      done: 0,
    };
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const priorityDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    tasks.forEach((t) => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const completedPct =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}!
        </h1>
        <p className="text-muted-foreground">{formatDate(new Date())}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {stats.completed}
            </div>
            <p className="text-xs text-muted-foreground">{completedPct}% done</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card className={stats.overdue > 0 ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""}>
          <CardHeader className="pb-2">
            <CardDescription className={stats.overdue > 0 ? "text-red-600" : ""}>
              Overdue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.overdue > 0 ? "text-red-600" : ""}`}>
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Tasks due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((t) => {
                  const days = daysFromNow(t.dueDate!);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.dueDate!).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={days <= 1 ? "destructive" : "secondary"}
                        className="ml-2 shrink-0"
                      >
                        {days === 0
                          ? "Today"
                          : days === 1
                          ? "Tomorrow"
                          : `${days} days`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest task updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((t) => (
                <div
                  key={t.id + t.activityType}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      t.activityType === "completed"
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.activityType === "completed" ? "Completed" : "Created"}{" "}
                      {relativeTime(t.activityDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Completion status per project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {projectProgress.map((p) => (
              <div key={p.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {p.done}/{p.total} tasks ({p.pct}%)
                  </span>
                </div>
                <Progress value={p.pct} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Distribution by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Tasks by status</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Stacked bar */}
            <div className="mb-4 flex h-6 overflow-hidden rounded-full">
              {Object.entries(statusDistribution).map(
                ([status, count]) =>
                  count > 0 && (
                    <div
                      key={status}
                      className={`${statusColors[status]} transition-all`}
                      style={{
                        width: `${(count / stats.total) * 100}%`,
                      }}
                    />
                  )
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 text-sm">
                  <div
                    className={`h-3 w-3 rounded-full ${statusColors[status]}`}
                  />
                  <span className="text-muted-foreground">
                    {statusLabels[status]}
                  </span>
                  <span className="ml-auto font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(priorityDistribution).map(
                ([priority, count]) => (
                  <div key={priority} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{priority}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${priorityColors[priority]} transition-all`}
                        style={{
                          width:
                            stats.total > 0
                              ? `${(count / stats.total) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                addTask({
                  title: "New Task",
                  description: "",
                  status: "todo",
                  priority: "medium",
                  dueDate: null,
                  project: null,
                  tags: [],
                })
              }
            >
              New Task
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                addProject({
                  name: "New Project",
                  color: "#6366f1",
                  description: "",
                })
              }
            >
              New Project
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                addEvent({
                  title: "New Event",
                  date: new Date().toISOString().slice(0, 10),
                  startTime: "09:00",
                  endTime: "10:00",
                  description: "",
                  color: "#6366f1",
                })
              }
            >
              New Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
