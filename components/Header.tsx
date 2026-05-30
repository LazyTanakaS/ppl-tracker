"use client";

interface HeaderProps {
  onScheduleOpen: () => void;
}

export default function Header({ onScheduleOpen }: HeaderProps) {
  const now = new Date();
  const days = [
    "ВОСКРЕСЕНЬЕ",
    "ПОНЕДЕЛЬНИК",
    "ВТОРНИК",
    "СРЕДА",
    "ЧЕТВЕРГ",
    "ПЯТНИЦА",
    "СУББОТА",
  ];
  const month = [
    "ЯНВ",
    "ФЕВ",
    "МАР",
    "АПР",
    "МАЙ",
    "ИЮН",
    "ИЮЛ",
    "АВГ",
    "СЕН",
    "ОКТ",
    "НОЯ",
    "ДЕК",
  ];

  const dayName = days[now.getDay()];
  const date = now.getDate();
  const monthName = month[now.getMonth()];
  const year = now.getFullYear();

  return (
    <header>
      <div className="logo">
        PPL<span>.</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
        <button className="schedule-open-btn" onClick={onScheduleOpen}>
          ☰
        </button>

        <div className="date-display">
          {dayName} <br />
          {date} {monthName} {year}
        </div>
      </div>
    </header>
  );
}
