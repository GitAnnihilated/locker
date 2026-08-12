/** Pure time-slicing helper — no I/O, easy to unit test. */

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Slices [startTime, endTime) into fixed-length slots, e.g.
 * ("10:00", "10:30", 10) -> [["10:00","10:10"], ["10:10","10:20"], ["10:20","10:30"]].
 * Drops a trailing partial slot rather than shortening it.
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotLengthMinutes: number,
): { startTime: string; endTime: string }[] {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (!(slotLengthMinutes > 0) || end <= start) return [];

  const slots: { startTime: string; endTime: string }[] = [];
  for (let t = start; t + slotLengthMinutes <= end; t += slotLengthMinutes) {
    slots.push({ startTime: toHHMM(t), endTime: toHHMM(t + slotLengthMinutes) });
  }
  return slots;
}
