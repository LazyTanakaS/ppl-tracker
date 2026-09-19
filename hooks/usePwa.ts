"use client";

import { useSyncExternalStore } from "react";
import { canPromptInstall, isIos, isStandalone, subscribeInstall } from "@/lib/pwa";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const noSubscription = () => () => {};

export function usePwa() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const canInstall = useSyncExternalStore(subscribeInstall, canPromptInstall, () => false);
  const standalone = useSyncExternalStore(noSubscription, isStandalone, () => false);
  const ios = useSyncExternalStore(noSubscription, isIos, () => false);
  return { online, canInstall, standalone, ios };
}
