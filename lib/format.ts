import { round1 } from "./stats.ts";

export function formatKg(value: number): string {
  return String(round1(value));
}

export function formatSignedKg(value: number): string {
  const rounded = round1(value);
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
