"use client";

import { useState, useMemo } from "react";
import { useAppStore, type Task } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  format,
  subDays,
  startOfDay,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  parseISO,
  isWithinInterval,
  differenceInDays,
} from "date-fns";

type Granularity = "daily" | "weekly" | "monthly";

// ─── Task Completion Trends ────────────────────────────────────────────────

export function CompletionTrendsChart() {
  const tasks = useAppStore((s) => s.tasks);
  const [days, setDays] = useState(30);
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const data = useMemo(() => {
    const now = startOfDay(new Date());
    const start = subDays(now, days);
    const completedTasks = tasks.filter(
      (t) =>
        t.completedAt &&
        isWithinInterval(parseISO(t.completedAt), { start, end: now })
    );

    if (granularity === "daily") {
      const allDays = eachDayOfInterval({ start, end: now });
      return allDays.map((d) => ({
        label: format(d, "MMM d"),
        count: completedTasks.filter(
          (t) => format(parseISO(t.completedAt!), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
        ).length,
      }));
    } else if (granularity === "weekly") {
      const weeks = eachWeekOfInterval({ start, end: now });
      return weeks.map((w, i) => {
        const weekEnd = i < weeks.length - 1 ? weeks[i + 1] : now;
        return {
          label: format(w, "MMM d"),
          count: completedTasks.filter((t) => {
            const d = parseISO(t.completedAt!);
            return d >= w && d < weekEnd;
          }).length,
        };
      });
    } else {
      // monthly - group by month
      const months: { label: string; count: number }[] = [];
      const buckets: Record<string, number> = {};
      completedTasks.forEach((t) => {
        const key = format(parseISO(t.completedAt!), "yyyy-MM");
        buckets[key] = (buckets[key] || 0) + 1;
      });
      let current = startOfMonth(start);
      while (current <= now) {
        const key = format(current, "yyyy-MM");
        months.push({ label: format(current, "MMM"), count: buckets[key] || 0 });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      return months;
    }
  }, [tasks, days, granularity]);

  const maxVal = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion Trends</CardTitle>
        <CardDescription>Tasks completed over time</CardDescription>
        <div className="flex items-center gap-3 mt-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground">{d.count || ""}</span>
                <div
                  className="w-full bg-primary/80 rounded-t-sm transition-all min-h-[2px]"
                  style={{ height: `${(d.count / maxVal) * 120}px` }}
                />
                <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                  {data.length <= 15 ? d.label : i % Math.ceil(data.length / 10) === 0 ? d.label : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Burndown Chart ────────────────────────────────────────────────────────

export function BurndownChart() {
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const chartData = useMemo(() => {
    const projectTasks = selectedProject === "all"
      ? tasks
      : tasks.filter((t) => t.project === selectedProject);

    if (projectTasks.length === 0) return { points: [], ideal: [], labels: [] };

    // Find date range from task creation to now (or latest due date)
    const createdDates = projectTasks.map((t) => parseISO(t.createdAt));
    const startDate = createdDates.reduce((a, b) => (a < b ? a : b));
    const now = startOfDay(new Date());
    const totalDays = Math.max(1, differenceInDays(now, startDate));
    const totalTasks = projectTasks.length;

    // Sample up to 30 points
    const numPoints = Math.min(totalDays + 1, 30);
    const step = Math.max(1, Math.floor(totalDays / (numPoints - 1)));

    const points: number[] = [];
    const ideal: number[] = [];
    const labels: string[] = [];

    for (let i = 0; i < numPoints; i++) {
      const dayOffset = Math.min(i * step, totalDays);
      const date = subDays(now, totalDays - dayOffset);
      const remaining = projectTasks.filter((t) => {
        if (t.status !== "done" || !t.completedAt) return true;
        return parseISO(t.completedAt) > date;
      }).length;
      points.push(remaining);
      ideal.push(Math.round(totalTasks * (1 - dayOffset / totalDays)));
      labels.push(format(date, "MMM d"));
    }

    return { points, ideal, labels };
  }, [tasks, selectedProject]);

  const maxVal = Math.max(1, ...chartData.points, ...chartData.ideal);
  const svgW = 500;
  const svgH = 200;
  const pad = { top: 10, right: 10, bottom: 30, left: 35 };
  const plotW = svgW - pad.left - pad.right;
  const plotH = svgH - pad.top - pad.bottom;

  function toPath(values: number[]) {
    if (values.length === 0) return "";
    return values
      .map((v, i) => {
        const x = pad.left + (i / Math.max(1, values.length - 1)) * plotW;
        const y = pad.top + (1 - v / maxVal) * plotH;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Burndown Chart</CardTitle>
        <CardDescription>Remaining tasks over time</CardDescription>
        <div className="mt-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.points.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => {
              const y = pad.top + (1 - f) * plotH;
              const val = Math.round(f * maxVal);
              return (
                <g key={f}>
                  <line x1={pad.left} x2={svgW - pad.right} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
                  <text x={pad.left - 5} y={y + 3} textAnchor="end" fontSize={9} fill="#9ca3af">{val}</text>
                </g>
              );
            })}
            {/* X-axis labels */}
            {chartData.labels.map((l, i) => {
              if (chartData.labels.length > 10 && i % Math.ceil(chartData.labels.length / 8) !== 0) return null;
              const x = pad.left + (i / Math.max(1, chartData.labels.length - 1)) * plotW;
              return (
                <text key={i} x={x} y={svgH - 5} textAnchor="middle" fontSize={8} fill="#9ca3af">{l}</text>
              );
            })}
            {/* Ideal line */}
            <path d={toPath(chartData.ideal)} fill="none" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="4 4" />
            {/* Actual line */}
            <path d={toPath(chartData.points)} fill="none" stroke="#6366f1" strokeWidth={2} />
            {/* Dots on actual */}
            {chartData.points.map((v, i) => {
              const x = pad.left + (i / Math.max(1, chartData.points.length - 1)) * plotW;
              const y = pad.top + (1 - v / maxVal) * plotH;
              return <circle key={i} cx={x} cy={y} r={2.5} fill="#6366f1" />;
            })}
            {/* Legend */}
            <line x1={svgW - 120} x2={svgW - 105} y1={10} y2={10} stroke="#6366f1" strokeWidth={2} />
            <text x={svgW - 100} y={13} fontSize={9} fill="#666">Actual</text>
            <line x1={svgW - 120} x2={svgW - 105} y1={22} y2={22} stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="4 4" />
            <text x={svgW - 100} y={25} fontSize={9} fill="#666">Ideal</text>
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
