"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  CheckSquare,
  Columns3,
  Calendar,
  Settings,
  Search,
  Plus,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "task" | "project" | "event" | "nav" | "action";
  title: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const navCommands: SearchResult[] = [
    { id: "nav-dashboard", type: "nav", title: "Go to Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, action: () => router.push("/") },
    { id: "nav-tasks", type: "nav", title: "Go to Tasks", icon: <CheckSquare className="h-4 w-4" />, action: () => router.push("/tasks") },
    { id: "nav-projects", type: "nav", title: "Go to Projects", icon: <Columns3 className="h-4 w-4" />, action: () => router.push("/projects") },
    { id: "nav-calendar", type: "nav", title: "Go to Calendar", icon: <Calendar className="h-4 w-4" />, action: () => router.push("/calendar") },
    { id: "nav-settings", type: "nav", title: "Go to Settings", icon: <Settings className="h-4 w-4" />, action: () => router.push("/settings") },
  ];

  const actionCommands: SearchResult[] = [
    { id: "act-task", type: "action", title: "Create Task", icon: <Plus className="h-4 w-4" />, action: () => router.push("/tasks") },
    { id: "act-project", type: "action", title: "Create Project", icon: <Plus className="h-4 w-4" />, action: () => router.push("/projects") },
    {
      id: "act-dark",
      type: "action",
      title: "Toggle Dark Mode",
      icon: <Moon className="h-4 w-4" />,
      action: () => {
        document.documentElement.classList.toggle("dark");
        const isDark = document.documentElement.classList.contains("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      },
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([...navCommands, ...actionCommands]);
      setSelectedIndex(0);
      return;
    }

    const lower = query.toLowerCase();
    const filtered = [...navCommands, ...actionCommands].filter((r) =>
      r.title.toLowerCase().includes(lower)
    );

    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const searchResults: SearchResult[] = [];
        for (const task of data.tasks || []) {
          searchResults.push({
            id: `task-${task.id}`,
            type: "task",
            title: task.title,
            icon: <CheckSquare className="h-4 w-4" />,
            action: () => router.push("/tasks"),
          });
        }
        for (const project of data.projects || []) {
          searchResults.push({
            id: `project-${project.id}`,
            type: "project",
            title: project.name,
            icon: <Columns3 className="h-4 w-4" />,
            action: () => router.push("/projects"),
          });
        }
        for (const event of data.events || []) {
          searchResults.push({
            id: `event-${event.id}`,
            type: "event",
            title: event.title,
            icon: <Calendar className="h-4 w-4" />,
            action: () => router.push("/calendar"),
          });
        }
        setResults([...searchResults, ...filtered]);
        setSelectedIndex(0);
      })
      .catch(() => {
        setResults(filtered);
        setSelectedIndex(0);
      });

    return () => controller.abort();
  }, [query]);

  const executeResult = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      result.action();
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      executeResult(results[selectedIndex]);
    }
  };

  const groupedResults = {
    task: results.filter((r) => r.type === "task"),
    project: results.filter((r) => r.type === "project"),
    event: results.filter((r) => r.type === "event"),
    nav: results.filter((r) => r.type === "nav"),
    action: results.filter((r) => r.type === "action"),
  };

  const groupLabels: Record<string, string> = {
    task: "Tasks",
    project: "Projects",
    event: "Events",
    nav: "Navigation",
    action: "Actions",
  };

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden" aria-label="Command palette">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or type a command..."
            className="border-0 focus-visible:ring-0 shadow-none"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1" role="listbox" aria-label="Search results">
          {results.length === 0 && query && (
            <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
          )}
          {(["task", "project", "event", "nav", "action"] as const).map((type) => {
            const group = groupedResults[type];
            if (group.length === 0) return null;
            return (
              <div key={type}>
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {groupLabels[type]}
                </p>
                {group.map((result) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <button
                      key={result.id}
                      role="option"
                      aria-selected={selectedIndex === idx}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer",
                        selectedIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                      onClick={() => executeResult(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      {result.icon}
                      <span>{result.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
