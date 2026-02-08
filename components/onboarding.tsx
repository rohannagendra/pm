"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Layers, CheckSquare, Columns3, Rocket } from "lucide-react";

const ONBOARDING_KEY = "projectflow-onboarded";

const steps = [
  {
    title: "Welcome to ProjectFlow",
    description: "A powerful project management app to organize your tasks, projects, and schedule. Let's take a quick tour!",
    icon: <Layers className="h-10 w-10 text-indigo-500" />,
  },
  {
    title: "Create Projects",
    description: "Organize your work into projects. Each project gets its own color and can hold many tasks. Head to the Projects page to create your first project.",
    icon: <Columns3 className="h-10 w-10 text-blue-500" />,
  },
  {
    title: "Manage Tasks",
    description: "Create tasks, set priorities, assign due dates, and track progress through the Kanban board. Drag and drop tasks between columns to update their status.",
    icon: <CheckSquare className="h-10 w-10 text-green-500" />,
  },
  {
    title: "You're All Set!",
    description: "Explore the Dashboard for analytics, use the Calendar for scheduling, and press Cmd/Ctrl+K anytime to search. You can restart this tour from Settings.",
    icon: <Rocket className="h-10 w-10 text-amber-500" />,
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setOpen(true);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
    setStep(0);
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent className="max-w-md text-center" aria-label="Onboarding wizard">
        <div className="flex flex-col items-center gap-4 py-4">
          {steps[step].icon}
          <h2 className="text-xl font-bold">{steps[step].title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed px-4">
            {steps[step].description}
          </p>
          {/* Step indicators */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip
            </Button>
            <Button size="sm" onClick={next}>
              {step < steps.length - 1 ? "Next" : "Get Started"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function restartOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
  window.location.reload();
}
