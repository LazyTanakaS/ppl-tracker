"use client";

import { useEffect } from "react";
import { initInstallPrompt } from "@/lib/pwa";

export default function PwaSetup() {
  useEffect(() => {
    initInstallPrompt();
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) =>
        console.warn("[pwa] Service worker registration failed", err),
      );
  }, []);
  return null;
}
