"use client";

export default function Header() {
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
      <div className="date-display">
        {dayName} <br />
        {date} {monthName} {year}
      </div>
    </header>
  );
}
