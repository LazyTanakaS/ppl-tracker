"use client";

import { useEffect, useState } from "react";

type Rest = { endAt: number; label: string } | null;

export function useRestTimer() {
  const [rest, setRest] = useState<Rest>(null);
  const [finished, setFinished] = useState(false);
  const endAt = rest?.endAt ?? null;

  useEffect(() => {
    if (endAt === null) return;

    const finish = () => {
      setRest(null);
      setFinished(true);
      try {
        navigator.vibrate?.([200, 100, 200, 100, 400]);
      } catch {}
    };
    const check = () => {
      if (Date.now() >= endAt) finish();
    };

    const timeout = setTimeout(check, Math.max(0, endAt - Date.now()) + 20);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", check);
    };
  }, [endAt]);

  function start(label: string, durationSeconds: number) {
    setFinished(false);
    setRest({ endAt: Date.now() + durationSeconds * 1000, label });
  }

  function stop() {
    setRest(null);
    setFinished(false);
  }

  return { rest, finished, start, stop };
}
