"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Trash2, RotateCcw, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { tasks, projects, events } = useAppStore();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
    localStorage.setItem("theme", !darkMode ? "dark" : "light");
  };

  const exportData = () => {
    const data = { tasks, projects, events, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projectflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = "Title,Status,Priority,Due Date,Project,Tags,Created\n";
    const rows = tasks
      .map((t) => {
        const proj = projects.find((p) => p.id === t.project);
        return `"${t.title}","${t.status}","${t.priority}","${t.dueDate || ""}","${proj?.name || ""}","${t.tags.join(", ")}","${t.createdAt}"`;
      })
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projectflow-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (confirm("Are you sure you want to delete all data? This cannot be undone.")) {
      localStorage.removeItem("projectflow-store");
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-muted-foreground mb-6">Manage your preferences and data</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize how ProjectFlow looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span>Dark Mode</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Toggle between light and dark theme
                </span>
              </Label>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>Download your data for backup or analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Export as JSON</p>
                <p className="text-sm text-muted-foreground">All tasks, projects, and events</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportData}>
                Download JSON
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Export Tasks as CSV</p>
                <p className="text-sm text-muted-foreground">Task data in spreadsheet format</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
            <CardDescription>Overview of your stored data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Tasks</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Reset to sample data</p>
                <p className="text-sm text-muted-foreground">Restore the default sample data</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearAllData}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete all data</p>
                <p className="text-sm text-muted-foreground">Permanently remove all tasks, projects, and events</p>
              </div>
              <Button variant="destructive" size="sm" onClick={clearAllData}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
