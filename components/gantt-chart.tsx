"use client";

import { useState, useMemo } from "react";
import { type Task, type TaskPriority } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  format,
  parseISO,
  differenceInDays,
  addDays,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  isToday,
  isSameMonth,
} from "date-fns";

type ZoomLevel = "day" | "week" | "month";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#6366f1",
  low: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  "in-progress": "#3b82f6",
  review: "#f59e0b",
  done: "#22c55e",
};

export default function GanttChart({ tasks }: { tasks: Task[] }) {
  const [zoom, setZoom] = useState<ZoomLevel>("week");

  const tasksWithDates = useMemo(
    () => tasks.filter((t) => t.dueDate),
    [tasks]
  );

  const { startDate, endDate, columns } = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const today = startOfDay(new Date());
      const end = addDays(today, 30);
      return {
        startDate: today,
        endDate: end,
        columns: eachDayOfInterval({ start: today, end }).map((d) => ({
          date: d,
          label: format(d, "MMM d"),
        })),
      };
    }

    const dates = tasksWithDates.map((t) => parseISO(t.dueDate!));
    const today = startOfDay(new Date());
    let minDate = dates.reduce((a, b) => (a < b ? a : b), today);
    let maxDate = dates.reduce((a, b) => (a > b ? a : b), today);

    // Add padding
    minDate = addDays(minDate, -7);
    maxDate = addDays(maxDate, 14);

    if (zoom === "day") {
      const days = eachDayOfInterval({ start: minDate, end: maxDate });
      return {
        startDate: minDate,
        endDate: maxDate,
        columns: days.map((d) => ({ date: d, label: format(d, "d") })),
      };
    } else if (zoom === "week") {
      const weeks = eachWeekOfInterval({ start: minDate, end: maxDate });
      return {
        startDate: minDate,
        endDate: maxDate,
        columns: weeks.map((d) => ({ date: d, label: format(d, "MMM d") })),
      };
    } else {
      // month
      const months: { date: Date; label: string }[] = [];
      let current = startOfMonth(minDate);
      while (current <= maxDate) {
        months.push({ date: current, label: format(current, "MMM yyyy") });
        current = addDays(endOfMonth(current), 1);
      }
      return { startDate: minDate, endDate: maxDate, columns: months };
    }
  }, [tasksWithDates, zoom]);

  const totalDays = Math.max(1, differenceInDays(endDate, startDate));
  const colWidth = zoom === "day" ? 32 : zoom === "week" ? 100 : 120;

  function getBarStyle(task: Task) {
    if (!task.dueDate) return { left: 0, width: 0 };
    const dueDate = parseISO(task.dueDate);
    // Assume task takes ~3 days before due date
    const taskStart = addDays(dueDate, -3);
    const leftDays = Math.max(0, differenceInDays(taskStart, startDate));
    const widthDays = 4; // 3-day bar width
    const totalWidth = columns.length * colWidth;
    const left = (leftDays / totalDays) * totalWidth;
    const width = Math.max(colWidth * 0.5, (widthDays / totalDays) * totalWidth);
    return { left, width };
  }

  if (tasksWithDates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No tasks with due dates to display on the Gantt chart.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["day", "week", "month"] as ZoomLevel[]).map((z) => (
          <Button
            key={z}
            variant={zoom === z ? "default" : "outline"}
            size="sm"
            onClick={() => setZoom(z)}
            className="capitalize"
          >
            {z}
          </Button>
        ))}
      </div>

      <div className="border rounded-lg overflow-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex border-b sticky top-0 bg-background z-10">
            <div className="w-48 shrink-0 border-r p-2 text-xs font-medium text-muted-foreground">
              Task
            </div>
            <div className="flex">
              {columns.map((col, i) => (
                <div
                  key={i}
                  className={`text-center text-[10px] font-medium text-muted-foreground border-r p-1 ${
                    isToday(col.date) ? "bg-primary/10" : ""
                  }`}
                  style={{ width: colWidth }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {tasksWithDates.map((task) => {
            const bar = getBarStyle(task);
            return (
              <div key={task.id} className="flex border-b hover:bg-muted/30">
                <div className="w-48 shrink-0 border-r p-2 text-xs truncate flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[task.status] }}
                  />
                  {task.title}
                </div>
                <div className="relative flex-1" style={{ minWidth: columns.length * colWidth, height: 36 }}>
                  {/* Grid lines */}
                  {columns.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-dashed border-muted"
                      style={{ left: i * colWidth }}
                    />
                  ))}
                  {/* Bar */}
                  <div
                    className="absolute top-1.5 h-5 rounded-sm cursor-default transition-colors"
                    style={{
                      left: bar.left,
                      width: bar.width,
                      backgroundColor: STATUS_COLORS[task.status],
                      opacity: task.status === "done" ? 0.5 : 0.85,
                    }}
                    title={`${task.title} - Due: ${task.dueDate}`}
                  >
                    <span className="text-[9px] text-white px-1 truncate block leading-5">
                      {task.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
