"use client";

import { useEffect, useState } from "react";

export type PlannerType = "FREELANCE_INDIVIDUAL" | "ESTABLISHED_FIRM";

export interface Planner {
  beaconCode: string;
  plannerType: PlannerType;
  values: Record<string, string>;
}

const KEY = "beacon-verify-planner";

/**
 * The planner lives only in this browser tab for the current session
 * (nothing is saved server-side). sessionStorage keeps it across refreshes.
 */
export function usePlanner() {
  const [planner, setPlanner] = useState<Planner | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setPlanner(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (planner) sessionStorage.setItem(KEY, JSON.stringify(planner));
      else sessionStorage.removeItem(KEY);
    } catch {}
  }, [planner, ready]);

  return { planner, setPlanner, ready };
}
