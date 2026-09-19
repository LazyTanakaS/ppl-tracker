"use client";

interface BackupReminderProps {
  onExport: () => void;
  onSnooze: () => void;
}

export default function BackupReminder({ onExport, onSnooze }: BackupReminderProps) {
  return (
    <div className="reminder" role="region" aria-label="Backup reminder">
      <p>Your workouts are only stored on this device. Save a backup file so they are safe if the phone or browser data is lost.</p>
      <div className="reminder-actions">
        <button type="button" className="primary-btn" onClick={onExport}>
          Download backup
        </button>
        <button type="button" className="link-btn" onClick={onSnooze}>
          Remind me next week
        </button>
      </div>
    </div>
  );
}
