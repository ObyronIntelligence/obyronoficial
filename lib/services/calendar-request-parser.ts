import type { GoogleAction } from "@/lib/types";

type DateParts = {
  day: number;
  month: number;
  year: number;
};

type TimeParts = {
  hour: number;
  minute: number;
};

type DurationParts = {
  hours: number;
  minutes: number;
};

export type ParsedCalendarRequest = {
  action?: GoogleAction;
  detected: boolean;
  missing: string[];
  reply: string;
};

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(parts: DateParts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function todayInSaoPaulo(): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  });
  const parts = formatter.formatToParts(new Date());

  return {
    day: Number(parts.find((part) => part.type === "day")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    year: Number(parts.find((part) => part.type === "year")?.value),
  };
}

function toNoonDate(parts: DateParts) {
  return new Date(`${formatDate(parts)}T12:00:00-03:00`);
}

function addDays(parts: DateParts, days: number): DateParts {
  const date = toNoonDate(parts);
  date.setUTCDate(date.getUTCDate() + days);

  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
}

function parseDate(input: string): DateParts | null {
  const normalized = normalizeText(input);
  const today = todayInSaoPaulo();
  const explicitDate = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);

  if (explicitDate) {
    const yearValue = explicitDate[3] ? Number(explicitDate[3]) : today.year;
    return {
      day: Number(explicitDate[1]),
      month: Number(explicitDate[2]),
      year: yearValue < 100 ? 2000 + yearValue : yearValue,
    };
  }

  const isoDate = normalized.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoDate) {
    return {
      year: Number(isoDate[1]),
      month: Number(isoDate[2]),
      day: Number(isoDate[3]),
    };
  }

  if (normalized.includes("depois de amanha")) {
    return addDays(today, 2);
  }

  if (normalized.includes("amanha")) {
    return addDays(today, 1);
  }

  if (normalized.includes("hoje")) {
    return today;
  }

  const weekdayEntry = Object.entries(WEEKDAYS).find(([label]) => normalized.includes(label));
  if (!weekdayEntry) {
    return null;
  }

  const targetWeekday = weekdayEntry[1];
  const currentWeekday = toNoonDate(today).getUTCDay();
  const diff = (targetWeekday - currentWeekday + 7) % 7 || 7;

  return addDays(today, diff);
}

function parseTime(input: string): TimeParts | null {
  const normalized = normalizeText(input);
  const patterns = [
    /\b(?:as|a|horario|hora)\s+([01]?\d|2[0-3])(?:[:h]\s*([0-5]\d))?\b/g,
    /\b([01]?\d|2[0-3]):([0-5]\d)\b/g,
    /\b([01]?\d|2[0-3])h([0-5]\d)?\b/g,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(normalized);
    while (match) {
      const prefix = normalized.slice(Math.max(0, match.index - 12), match.index);
      if (!/\b(por|duracao|dura)\s*$/.test(prefix)) {
        return {
          hour: Number(match[1]),
          minute: Number(match[2] || 0),
        };
      }

      match = pattern.exec(normalized);
    }
  }

  return null;
}

function parseDuration(input: string): DurationParts | null {
  const normalized = normalizeText(input);
  const compact = normalized.match(/\b(?:por|duracao de|duracao|dura|durara)\s+(\d+)h(?:(\d{1,2}))?\b/);

  if (compact) {
    return {
      hours: Number(compact[1]),
      minutes: Number(compact[2] || 0),
    };
  }

  const hours = normalized.match(
    /\b(?:por|duracao de|duracao|dura|durara)\s+(\d+(?:[,.]\d+)?)\s*(?:horas?|hrs?)\b/,
  );
  if (hours) {
    const totalHours = Number(hours[1].replace(",", "."));
    const fullHours = Math.floor(totalHours);
    return {
      hours: fullHours,
      minutes: Math.round((totalHours - fullHours) * 60),
    };
  }

  const minutes = normalized.match(
    /\b(?:por|duracao de|duracao|dura|durara)\s+(\d+)\s*(?:minutos?|min)\b/,
  );
  if (minutes) {
    return {
      hours: 0,
      minutes: Number(minutes[1]),
    };
  }

  return null;
}

function extractSummary(input: string) {
  return input
    .replace(
      /^(por favor\s+)?(quero\s+que\s+)?(voce\s+)?(agende|agenda|marque|marca|coloque|coloca|crie|criar)\s+(pra\s+mim\s+|para\s+mim\s+)?/i,
      "",
    )
    .replace(/^(um|uma)\s+(evento|compromisso|reuniao|reunião)\s+(chamado|chamada|de|com|para)?\s*/i, "")
    .replace(/^(na|no)\s+(agenda|calendario|calendar)\s+/i, "")
    .replace(/\b(na|no|nesta|nesse|para|pra|em)?\s*(hoje|amanha|amanhã|depois de amanha|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo)(-feira)?\b.*$/i, "")
    .replace(/\b(?:as|às|a|horario|horário|hora)\s+\d{1,2}(?::\d{2}|h\d{0,2})?.*$/i, "")
    .replace(/\bpor\s+\d+(?:[,.]\d+)?\s*(horas?|hrs?|h|minutos?|min)\b.*$/i, "")
    .replace(/[.,;:!?]+$/g, "")
    .trim();
}

function isCalendarRequest(input: string) {
  const normalized = normalizeText(input);
  return /\b(agenda|agende|agendar|calendario|calendar|evento|compromisso|marque|marcar)\b/.test(normalized);
}

function formatMissing(missing: string[]) {
  if (missing.length === 1) {
    return missing[0];
  }

  return `${missing.slice(0, -1).join(", ")} e ${missing[missing.length - 1]}`;
}

export function parseCalendarRequest(input: string): ParsedCalendarRequest {
  if (!isCalendarRequest(input)) {
    return { detected: false, missing: [], reply: "" };
  }

  const summary = extractSummary(input);
  const date = parseDate(input);
  const time = parseTime(input);
  const duration = parseDuration(input);
  const missing = [
    summary ? "" : "nome do evento",
    date ? "" : "data",
    time ? "" : "horario de inicio",
    duration ? "" : "duracao",
  ].filter(Boolean);
  const eventLabel = summary ? `o evento "${summary}"` : "esse evento";

  if (missing.length > 0 || !summary || !date || !time || !duration) {
    return {
      detected: true,
      missing,
      reply: `Consigo criar ${eventLabel} no Google Calendar, mas preciso de ${formatMissing(missing)}. Me envie no formato: nome do evento, data, horario de inicio e duracao.`,
    };
  }

  const start = `${formatDate(date)}T${pad(time.hour)}:${pad(time.minute)}:00-03:00`;

  return {
    detected: true,
    missing: [],
    action: {
      service: "calendar",
      operation: "create_event",
      params: {
        summary,
        start,
        durationHours: duration.hours,
        durationMinutes: duration.minutes,
        timeZone: "America/Sao_Paulo",
      },
    },
    reply: `Vou criar no Google Calendar: "${summary}", em ${formatDate(date)} as ${pad(time.hour)}:${pad(time.minute)}, por ${duration.hours}h${duration.minutes ? ` ${duration.minutes}min` : ""}.`,
  };
}
