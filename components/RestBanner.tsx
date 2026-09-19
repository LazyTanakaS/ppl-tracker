"use client";

import { useEffect, useState } from "react";

interface RestBannerProps {
  rest: { endAt: number; label: string } | null;
  finished: boolean;
  onStop: () => void;
}

function Countdown({ endAt }: { endAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () =>
      setNow((prev) => {
        const current = Date.now();
        return Math.ceil((endAt - prev) / 1000) ===
          Math.ceil((endAt - current) / 1000)
          ? prev
          : current;
      });
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [endAt]);

  const left = Math.max(0, Math.ceil((endAt - now) / 1000));
  return (
    <span className="rest-time">
      {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
    </span>
  );
}

export default function RestBanner({
  rest,
  finished,
  onStop,
}: RestBannerProps) {
  if (!rest && !finished) return null;

  return (
    <>
      <div className="rest-banner-spacer" aria-hidden="true" />
      <div className={`rest-banner ${finished ? "finished" : ""}`}>
        {rest ? (
          <>
            <span className="rest-label" role="timer" aria-live="off">
              REST <Countdown key={rest.endAt} endAt={rest.endAt} />
              <span className="rest-exercise">{rest.label}</span>
            </span>
            <button type="button" className="rest-banner-btn" onClick={onStop}>
              STOP
            </button>
          </>
        ) : (
          <>
            <span className="rest-label" role="status">
              Rest finished - next set
            </span>
            <button type="button" className="rest-banner-btn" onClick={onStop}>
              OK
            </button>
          </>
        )}
      </div>
    </>
  );
}
