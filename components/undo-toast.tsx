"use client";

import { useEffect, useCallback } from "react";
import { useUndoStore } from "@/lib/undo-store";
import { Button } from "@/components/ui/button";
import { Undo2, X } from "lucide-react";

export function UndoToast() {
  const stack = useUndoStore((s) => s.stack);
  const pop = useUndoStore((s) => s.pop);
  const remove = useUndoStore((s) => s.remove);

  const handleUndo = useCallback(() => {
    const action = pop();
    if (action) {
      action.undo();
    }
  }, [pop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  if (stack.length === 0) return null;

  const latest = stack[stack.length - 1];

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <span className="text-sm">{latest.label}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={handleUndo}
      >
        <Undo2 className="h-3 w-3" />
        Undo
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => remove(latest.id)}
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
