/**
 * Parse user input into { date: YYYY-MM-DD, time?: HH:MM } or null.
 * Handles "Feb 19", "2026-02-19", "tomorrow", "Feb 19 at 3pm", "Feb 19 10:30", etc.
 */
export function parseUserDate(
  input: string
): { date: string; time?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (trimmed === "tomorrow" || trimmed === "tmr") {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { date: d.toISOString().slice(0, 10) };
  }

  const timePatterns = [
    /\bat\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
  ];

  let extractedTime: string | undefined;
  let dateOnly = trimmed;

  for (const pattern of timePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = (match[3] || "").toLowerCase();

      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;

      extractedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      dateOnly = trimmed.replace(pattern, "").replace(/\s+/g, " ").trim();
      break;
    }
  }

  const dateLower = dateOnly.toLowerCase();

  if (dateLower === "tomorrow") {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { date: d.toISOString().slice(0, 10), time: extractedTime };
  }

  if (dateLower === "today") {
    return { date: today.toISOString().slice(0, 10), time: extractedTime };
  }

  const ddmmyyyy = dateOnly.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    const d = new Date(iso + "T00:00:00Z");
    if (!isNaN(d.getTime())) return { date: iso, time: extractedTime };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const d = new Date(dateOnly + "T00:00:00Z");
    if (!isNaN(d.getTime())) return { date: dateOnly, time: extractedTime };
  }

  const monthNames: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };

  const mdy = dateLower.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (mdy && monthNames[mdy[1]] !== undefined) {
    const day = parseInt(mdy[2], 10);
    const year = mdy[3] ? parseInt(mdy[3], 10) : today.getFullYear();
    const iso = `${year}-${(monthNames[mdy[1]] + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const d = new Date(iso + "T00:00:00Z");
    if (!isNaN(d.getTime())) return { date: iso, time: extractedTime };
  }

  const dmy = dateLower.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
  if (dmy && monthNames[dmy[2]] !== undefined) {
    const day = parseInt(dmy[1], 10);
    const year = dmy[3] ? parseInt(dmy[3], 10) : today.getFullYear();
    const iso = `${year}-${(monthNames[dmy[2]] + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const d = new Date(iso + "T00:00:00Z");
    if (!isNaN(d.getTime())) return { date: iso, time: extractedTime };
  }

  return null;
}

/** Format YYYY-MM-DD as "Feb 19" for human-friendly messages. */
export function formatFriendlyDate(dateValue: string): string {
  const d = new Date(dateValue + "T12:00:00Z");
  if (isNaN(d.getTime())) return dateValue;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Format HH:MM as "3pm", "10:30am" for human-friendly messages. */
export function formatFriendlyTime(timeValue: string): string {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const ampm = hours >= 12 ? "pm" : "am";
  const h12 = hours % 12 || 12;
  if (minutes === 0) return `${h12}${ampm}`;
  return `${h12}:${minutes.toString().padStart(2, "0")}${ampm}`;
}

/** Build inline keyboard rows for the next N days. Each row has up to 7 days. */
export function buildCalendarDays(
  daysCount: number,
  messageId: string
): { text: string; callback_data: string }[][] {
  const rows: { text: string; callback_data: string }[][] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  const rowsCount = 3;
  const buttonsPerRow = Math.ceil(daysCount / rowsCount);

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = formatFriendlyDate(dateStr);
    const btn = { text: label, callback_data: `custom_date:${messageId}:${dateStr}` };
    const rowIndex = Math.floor(i / buttonsPerRow);
    if (!rows[rowIndex]) rows[rowIndex] = [];
    rows[rowIndex].push(btn);
  }

  return rows.slice(0, 3);
}

export function generateSuggestedDates(datelineDate: string): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: Date[] = [];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  results.push(tomorrow);

  const base = new Date(datelineDate + "T00:00:00Z");
  if (!isNaN(base.getTime())) {
    for (const daysBefore of [3, 5, 7]) {
      const d = new Date(base);
      d.setDate(d.getDate() - daysBefore);
      if (d > today) results.push(d);
    }
  }

  let gap = 3;
  while (results.length < 3) {
    const d = new Date(today);
    d.setDate(d.getDate() + gap);
    results.push(d);
    gap += 2;
  }

  return Array.from(new Map(results.map((d) => [d.toISOString().slice(0, 10), d])).values())
    .sort((a, b) => a.getTime() - b.getTime())
    .slice(0, 3)
    .map((d) => d.toISOString().slice(0, 10));
}

export function formatDateForButton(dateISO: string): string {
  const d = new Date(dateISO + "T12:00:00Z");
  if (isNaN(d.getTime())) return dateISO;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
