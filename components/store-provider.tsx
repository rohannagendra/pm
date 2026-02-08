"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
