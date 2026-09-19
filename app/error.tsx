"use client";

import { useState } from "react";
import { clearAppData, downloadRawData } from "@/lib/storage";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyDetails() {
    const details = `PPL Tracker error: ${error.message}${error.digest ? ` (digest ${error.digest})` : ""}\n${error.stack ?? ""}`;
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function handleErase() {
    if (
      window.confirm(
        "Erase all PPL Tracker data on this device and start fresh? Download your data first - this cannot be undone.",
      )
    ) {
      clearAppData();
      window.location.reload();
    }
  }

  return (
    <main className="crash">
      <h1 className="crash-title">Something went wrong</h1>
      <p className="crash-text">
        The app hit an unexpected error. Your data is still stored on this device.
      </p>
      <p className="crash-detail">{error.message}</p>
      <div className="crash-actions">
        <button className="save-btn" onClick={() => unstable_retry()}>
          Try again
        </button>
        <button className="reset-btn" onClick={copyDetails}>
          {copied ? "Copied" : "Copy error details"}
        </button>
        <button className="reset-btn" onClick={downloadRawData}>
          Download my data
        </button>
        <button className="reset-btn" onClick={handleErase}>
          Erase data and restart
        </button>
      </div>
    </main>
  );
}
