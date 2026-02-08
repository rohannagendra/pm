"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  { key: "1", label: "Go to Dashboard", route: "/" },
  { key: "2", label: "Go to Tasks", route: "/tasks" },
  { key: "3", label: "Go to Projects", route: "/projects" },
  { key: "4", label: "Go to Calendar", route: "/calendar" },
  { key: "5", label: "Go to Settings", route: "/settings" },
  { key: "?", label: "Show keyboard shortcuts" },
  { key: "Cmd/Ctrl + K", label: "Open command palette" },
  { key: "Cmd/Ctrl + Z", label: "Undo last action" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "1":
          e.preventDefault();
          router.push("/");
          break;
        case "2":
          e.preventDefault();
          router.push("/tasks");
          break;
        case "3":
          e.preventDefault();
          router.push("/projects");
          break;
        case "4":
          e.preventDefault();
          router.push("/calendar");
          break;
        case "5":
          e.preventDefault();
          router.push("/settings");
          break;
        case "?":
          e.preventDefault();
          setHelpOpen((o) => !o);
          break;
      }
    },
    [router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-sm" aria-label="Keyboard shortcuts">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
