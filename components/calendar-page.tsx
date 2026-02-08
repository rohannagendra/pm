"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addYears,
  isSameDay,
  isSameMonth,
  isToday,
  isBefore,
  isAfter,
  parseISO,
  startOfDay,
} from "date-fns";
import { useProjectStore } from "@/lib/project-store";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CalendarDays,
  Circle,
  Trash2,
  Repeat,
  Globe,
} from "lucide-react";
import { useAppStore, type Task, type CalendarEvent } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

const EVENT_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ─── Event Creation Dialog ───────────────────────────────────────────────────

function EventDialog({
  open,
  onOpenChange,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialDate: Date;
}) {
  const addEvent = useAppStore((s) => s.addEvent);
  const { timezone } = useProjectStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(initialDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [recurrencePattern, setRecurrencePattern] = useState<string>("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const recurrence = recurrencePattern !== "none"
      ? JSON.stringify({ pattern: recurrencePattern, interval: 1, endDate: recurrenceEndDate || undefined })
      : null;
    addEvent({ title: title.trim(), date, startTime, endTime, description, color, recurrence, timezone });
    setTitle("");
    setDescription("");
    setRecurrencePattern("none");
    setRecurrenceEndDate("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evt-title">Title</Label>
            <Input
              id="evt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="evt-date">Date</Label>
              <Input
                id="evt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evt-start">Start</Label>
              <Input
                id="evt-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evt-end">End</Label>
              <Input
                id="evt-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="evt-desc">Description</Label>
            <Textarea
              id="evt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color === c ? "scale-125 border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recurrence</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {recurrencePattern !== "none" && (
                <Input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  placeholder="End date (optional)"
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Recurring Event Generation ──────────────────────────────────────────────

function generateRecurringInstances(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const result: CalendarEvent[] = [];
  for (const event of events) {
    if (!event.recurrence) {
      result.push(event);
      continue;
    }
    let rec: { pattern: string; interval: number; endDate?: string };
    try {
      rec = JSON.parse(event.recurrence);
    } catch {
      result.push(event);
      continue;
    }

    const eventDate = parseISO(event.date);
    const endLimit = rec.endDate ? parseISO(rec.endDate) : rangeEnd;
    const limit = isBefore(endLimit, rangeEnd) ? endLimit : rangeEnd;

    // Add original
    if (!isBefore(eventDate, rangeStart) && !isAfter(eventDate, rangeEnd)) {
      result.push(event);
    }

    // Generate instances
    let current = eventDate;
    for (let i = 0; i < 365; i++) {
      switch (rec.pattern) {
        case "daily": current = addDays(current, rec.interval); break;
        case "weekly": current = addWeeks(current, rec.interval); break;
        case "monthly": current = addMonths(current, rec.interval); break;
        case "yearly": current = addYears(current, rec.interval); break;
        default: current = addDays(limit, 1); // stop
      }
      if (isAfter(current, limit)) break;
      if (isBefore(current, rangeStart)) continue;
      result.push({
        ...event,
        id: `${event.id}_${format(current, "yyyy-MM-dd")}`,
        date: format(current, "yyyy-MM-dd"),
      });
    }
  }
  return result;
}

// ─── Task Quick-Add Dialog ───────────────────────────────────────────────────

function TaskDialog({
  open,
  onOpenChange,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialDate: Date;
}) {
  const addTask = useAppStore((s) => s.addTask);
  const projects = useAppStore((s) => s.projects);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [project, setProject] = useState<string>("none");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description: "",
      status: "todo",
      priority,
      dueDate: format(initialDate, "yyyy-MM-dd"),
      project: project === "none" ? null : project,
      tags: [],
      recurrence: null,
      estimatedMinutes: null,
      assigneeId: null,
    });
    setTitle("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Task for {format(initialDate, "MMM d, yyyy")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
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
              <Label>Project</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Day Detail Dialog ───────────────────────────────────────────────────────

function DayDetailDialog({
  open,
  onOpenChange,
  date,
  tasks,
  events,
  projects,
  onAddEvent,
  onAddTask,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date;
  tasks: Task[];
  events: CalendarEvent[];
  projects: { id: string; name: string; color: string }[];
  onAddEvent: () => void;
  onAddTask: () => void;
}) {
  const deleteTask = useAppStore((s) => s.deleteTask);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const today = startOfDay(new Date());
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{format(date, "EEEE, MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Events</h4>
              <Button size="sm" variant="outline" onClick={onAddEvent}>
                <Plus className="h-3 w-3 mr-1" /> Event
              </Button>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events</p>
            ) : (
              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: evt.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{evt.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {evt.startTime} - {evt.endTime}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => deleteEvent(evt.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Tasks</h4>
              <Button size="sm" variant="outline" onClick={onAddTask}>
                <Plus className="h-3 w-3 mr-1" /> Task
              </Button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks due</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const overdue =
                    task.dueDate &&
                    isBefore(parseISO(task.dueDate), today) &&
                    task.status !== "done";
                  const proj = task.project ? projectMap[task.project] : null;
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border p-2 text-sm",
                        overdue && "border-red-400 bg-red-50 dark:bg-red-950/20"
                      )}
                    >
                      <Circle
                        className="h-3 w-3 shrink-0"
                        style={{ color: proj?.color ?? "#94a3b8" }}
                        fill={proj?.color ?? "#94a3b8"}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium truncate", task.status === "done" && "line-through text-muted-foreground")}>
                          {task.title}
                        </p>
                        <div className="flex gap-1.5 mt-0.5">
                          <Badge
                            variant={task.priority === "urgent" ? "destructive" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────

function MonthView({
  currentDate,
  onSelectDay,
}: {
  currentDate: Date;
  onSelectDay: (d: Date) => void;
}) {
  const tasks = useAppStore((s) => s.tasks);
  const events = useAppStore((s) => s.events);
  const projects = useAppStore((s) => s.projects);
  const today = startOfDay(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  function getTasksForDay(day: Date) {
    return tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), day));
  }
  const expandedEvents = useMemo(
    () => generateRecurringInstances(events, calStart, calEnd),
    [events, calStart, calEnd]
  );

  function getEventsForDay(day: Date) {
    return expandedEvents.filter((e) => isSameDay(parseISO(e.date), day));
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 border-t border-l">
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const todayCell = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={cn(
                "relative border-r border-b p-1.5 min-h-[90px] text-left transition-colors hover:bg-muted/50",
                !inMonth && "bg-muted/30 text-muted-foreground",
                todayCell && "bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  todayCell && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Events as colored bars */}
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    className="truncate rounded px-1 text-[10px] font-medium text-white leading-4 flex items-center gap-0.5"
                    style={{ backgroundColor: evt.color }}
                  >
                    {evt.recurrence && <Repeat className="h-2.5 w-2.5 shrink-0" />}
                    {evt.title}
                  </div>
                ))}
              </div>

              {/* Tasks as dots */}
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap">
                  {dayTasks.slice(0, 5).map((t) => {
                    const overdue =
                      t.dueDate &&
                      isBefore(parseISO(t.dueDate), today) &&
                      t.status !== "done";
                    const proj = t.project ? projectMap[t.project] : null;
                    return (
                      <span
                        key={t.id}
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: overdue
                            ? "#ef4444"
                            : proj?.color ?? "#94a3b8",
                        }}
                        title={t.title}
                      />
                    );
                  })}
                  {dayTasks.length > 5 && (
                    <span className="text-[9px] text-muted-foreground leading-none">
                      +{dayTasks.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Overflow indicator */}
              {dayEvents.length > 2 && (
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  +{dayEvents.length - 2} more
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────────────

function WeekView({
  currentDate,
  onSelectDay,
}: {
  currentDate: Date;
  onSelectDay: (d: Date) => void;
}) {
  const tasks = useAppStore((s) => s.tasks);
  const events = useAppStore((s) => s.events);
  const projects = useAppStore((s) => s.projects);
  const today = startOfDay(new Date());

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  return (
    <div className="overflow-auto">
      {/* Header row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
        <div className="p-2" />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDay(day)}
            className={cn(
              "p-2 text-center border-l hover:bg-muted/50",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
            <div
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) && "bg-primary text-primary-foreground"
              )}
            >
              {format(day, "d")}
            </div>
            {/* Tasks as dots under date */}
            {(() => {
              const dt = tasks.filter(
                (t) => t.dueDate && isSameDay(parseISO(t.dueDate), day)
              );
              if (dt.length === 0) return null;
              return (
                <div className="flex justify-center gap-0.5 mt-1">
                  {dt.slice(0, 4).map((t) => {
                    const overdue =
                      t.dueDate && isBefore(parseISO(t.dueDate), today) && t.status !== "done";
                    const proj = t.project ? projectMap[t.project] : null;
                    return (
                      <span
                        key={t.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: overdue ? "#ef4444" : proj?.color ?? "#94a3b8",
                        }}
                      />
                    );
                  })}
                </div>
              );
            })()}
          </button>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="text-[10px] text-muted-foreground text-right pr-2 py-3 border-b">
              {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
            </div>
            {days.map((day) => {
              const dayEvents = events.filter(
                (e) =>
                  isSameDay(parseISO(e.date), day) &&
                  timeToMinutes(e.startTime) < (hour + 1) * 60 &&
                  timeToMinutes(e.endTime) > hour * 60
              );
              return (
                <div
                  key={`${hour}-${day.toISOString()}`}
                  className="border-l border-b min-h-[48px] relative p-0.5"
                >
                  {dayEvents.map((evt) => {
                    const startMin = timeToMinutes(evt.startTime);
                    const isStart = startMin >= hour * 60 && startMin < (hour + 1) * 60;
                    if (!isStart) return null;
                    const duration = timeToMinutes(evt.endTime) - startMin;
                    const heightSlots = Math.max(1, Math.ceil(duration / 60));
                    return (
                      <div
                        key={evt.id}
                        className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] text-white font-medium truncate z-10 cursor-pointer"
                        style={{
                          backgroundColor: evt.color,
                          top: `${((startMin - hour * 60) / 60) * 100}%`,
                          height: `${heightSlots * 48 - 4}px`,
                        }}
                        title={`${evt.title}\n${evt.startTime} - ${evt.endTime}`}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────────

function DayView({
  currentDate,
  onAddEvent,
  onAddTask,
}: {
  currentDate: Date;
  onAddEvent: () => void;
  onAddTask: () => void;
}) {
  const tasks = useAppStore((s) => s.tasks);
  const events = useAppStore((s) => s.events);
  const projects = useAppStore((s) => s.projects);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const today = startOfDay(new Date());

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const dayTasks = tasks.filter(
    (t) => t.dueDate && isSameDay(parseISO(t.dueDate), currentDate)
  );
  const dayEvents = events.filter((e) => isSameDay(parseISO(e.date), currentDate));

  return (
    <div className="space-y-6">
      {/* Tasks section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Tasks Due ({dayTasks.length})
          </h3>
          <Button size="sm" variant="outline" onClick={onAddTask}>
            <Plus className="h-3 w-3 mr-1" /> Add Task
          </Button>
        </div>
        {dayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground border rounded-md p-4 text-center">
            No tasks due today
          </p>
        ) : (
          <div className="space-y-2">
            {dayTasks.map((task) => {
              const overdue =
                task.dueDate && isBefore(parseISO(task.dueDate), today) && task.status !== "done";
              const proj = task.project ? projectMap[task.project] : null;
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 border rounded-md p-3",
                    overdue && "border-red-400 bg-red-50 dark:bg-red-950/20"
                  )}
                >
                  <Circle
                    className="h-4 w-4 shrink-0"
                    style={{ color: proj?.color ?? "#94a3b8" }}
                    fill={proj?.color ?? "#94a3b8"}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        task.status === "done" && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge
                        variant={task.priority === "urgent" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                      {proj && (
                        <Badge variant="outline" className="text-xs" style={{ borderColor: proj.color, color: proj.color }}>
                          {proj.name}
                        </Badge>
                      )}
                      {overdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteTask(task.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Events timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Events ({dayEvents.length})
          </h3>
          <Button size="sm" variant="outline" onClick={onAddEvent}>
            <Plus className="h-3 w-3 mr-1" /> Add Event
          </Button>
        </div>

        {/* Time slots */}
        <div className="border rounded-md overflow-hidden">
          {HOURS.filter((h) => h >= 7 && h <= 20).map((hour) => {
            const hourEvents = dayEvents.filter(
              (e) =>
                timeToMinutes(e.startTime) < (hour + 1) * 60 &&
                timeToMinutes(e.endTime) > hour * 60
            );
            return (
              <div key={hour} className="flex border-b last:border-b-0 min-h-[48px]">
                <div className="w-16 shrink-0 text-[11px] text-muted-foreground text-right pr-2 py-2 border-r bg-muted/30">
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </div>
                <div className="flex-1 relative p-0.5">
                  {hourEvents.map((evt) => {
                    const startMin = timeToMinutes(evt.startTime);
                    const isStart = startMin >= hour * 60 && startMin < (hour + 1) * 60;
                    if (!isStart) return null;
                    return (
                      <div
                        key={evt.id}
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm text-white font-medium"
                        style={{ backgroundColor: evt.color }}
                      >
                        <span className="truncate flex-1">{evt.title}</span>
                        <span className="text-xs opacity-80 shrink-0">
                          {evt.startTime} - {evt.endTime}
                        </span>
                        <button
                          onClick={() => deleteEvent(evt.id)}
                          className="opacity-60 hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Calendar Page ──────────────────────────────────────────────────────

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const tasks = useAppStore((s) => s.tasks);
  const events = useAppStore((s) => s.events);
  const projects = useAppStore((s) => s.projects);
  const { timezone, loadTimezone } = useProjectStore();

  useEffect(() => { loadTimezone(); }, [loadTimezone]);

  const dialogDate = selectedDay ?? currentDate;

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && selectedDay && isSameDay(parseISO(t.dueDate), selectedDay)),
    [tasks, selectedDay]
  );
  const dayEvents = useMemo(
    () => events.filter((e) => selectedDay && isSameDay(parseISO(e.date), selectedDay)),
    [events, selectedDay]
  );

  function navigateBack() {
    if (view === "month") setCurrentDate((d) => subMonths(d, 1));
    else if (view === "week") setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  }
  function navigateForward() {
    if (view === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (view === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  }
  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleSelectDay(day: Date) {
    setSelectedDay(day);
    setShowDayDetail(true);
  }

  function handleAddEventFromDetail() {
    setShowDayDetail(false);
    setShowEventDialog(true);
  }
  function handleAddTaskFromDetail() {
    setShowDayDetail(false);
    setShowTaskDialog(true);
  }

  const headerLabel =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`
        : format(currentDate, "EEEE, MMMM d, yyyy");

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={navigateForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">{headerLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="border rounded-md flex">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <Button
                key={v}
                variant={view === v ? "default" : "ghost"}
                size="sm"
                className="rounded-none first:rounded-l-md last:rounded-r-md capitalize"
                onClick={() => setView(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSelectedDay(currentDate);
              setShowEventDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Event
          </Button>
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <Globe className="h-3.5 w-3.5" />
            {timezone}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {view === "month" && (
          <MonthView currentDate={currentDate} onSelectDay={handleSelectDay} />
        )}
        {view === "week" && (
          <WeekView currentDate={currentDate} onSelectDay={handleSelectDay} />
        )}
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            onAddEvent={() => {
              setSelectedDay(currentDate);
              setShowEventDialog(true);
            }}
            onAddTask={() => {
              setSelectedDay(currentDate);
              setShowTaskDialog(true);
            }}
          />
        )}
      </div>

      {/* Dialogs */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        initialDate={dialogDate}
      />
      <TaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        initialDate={dialogDate}
      />
      {selectedDay && (
        <DayDetailDialog
          open={showDayDetail}
          onOpenChange={setShowDayDetail}
          date={selectedDay}
          tasks={dayTasks}
          events={dayEvents}
          projects={projects}
          onAddEvent={handleAddEventFromDetail}
          onAddTask={handleAddTaskFromDetail}
        />
      )}
    </div>
  );
}
