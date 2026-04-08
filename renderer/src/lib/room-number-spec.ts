/**
 * Expands a comma-separated list of single numbers and inclusive ranges into room numbers.
 * Examples: "801-804" → [801,802,803,804]; "801,803,805-807" → [801,803,805,806,807]
 */
export function parseRoomNumberRangeSpec(
  raw: string,
  expectedCount: number
): { numbers: number[] } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: 'Enter a room list or range, or leave blank to use the first room number.' };
  }

  const parts = trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const numbers: number[] = [];

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      for (let n = lo; n <= hi; n++) numbers.push(n);
    } else if (/^\d+$/.test(part)) {
      numbers.push(parseInt(part, 10));
    } else {
      return { error: `Invalid segment "${part}". Use numbers like 801 or ranges like 801-810.` };
    }
  }

  if (numbers.length !== expectedCount) {
    return {
      error: `Room list must define exactly ${expectedCount} rooms (found ${numbers.length}).`,
    };
  }

  const seen = new Set<number>();
  for (const n of numbers) {
    if (seen.has(n)) {
      return { error: `Duplicate room number ${n} in the list.` };
    }
    seen.add(n);
  }

  return { numbers };
}

export function sequentialRoomNumbers(firstRoom: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => firstRoom + i);
}
