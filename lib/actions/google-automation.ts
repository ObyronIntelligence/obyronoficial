import type { GoogleAction } from "@/lib/types";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API_BASE = "https://www.googleapis.com";

function parseJsonEnv<T>(rawValue: string | undefined, fallback: T): T {
  if (!rawValue) return fallback;

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function normalizeDatePayload(value: string, timeZone: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { date: value, timeZone };
  }

  return { dateTime: value, timeZone };
}

function resolveSpreadsheetId(reference?: string): string | undefined {
  if (!reference) return undefined;

  const aliasMap = parseJsonEnv<Record<string, string>>(process.env.GOOGLE_SHEETS_ALIASES, {});
  if (aliasMap[reference]) {
    return aliasMap[reference];
  }

  const urlMatch = reference.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  return reference;
}

async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Integração Google não configurada. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REFRESH_TOKEN."
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || "Falha ao autenticar com o Google.");
  }

  return data.access_token as string;
}

async function googleFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = await getGoogleAccessToken();
  const response = await fetch(`${GOOGLE_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Erro ao chamar API do Google.");
  }

  return data as T;
}

type AutomationResult = {
  summary: string;
};

export class GoogleAutomationService {
  static getStatus() {
    const configured =
      Boolean(process.env.GOOGLE_CLIENT_ID) &&
      Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
      Boolean(process.env.GOOGLE_REFRESH_TOKEN);

    return {
      configured,
      calendarDefaultId: process.env.GOOGLE_CALENDAR_ID || "primary",
      sheetsDefaultId: process.env.GOOGLE_SHEETS_DEFAULT_SPREADSHEET_ID || null,
      sheetsAliasesConfigured: Boolean(process.env.GOOGLE_SHEETS_ALIASES),
    };
  }

  static async executeActions(actions: GoogleAction[]): Promise<string[]> {
    const summaries: string[] = [];

    for (const action of actions) {
      const result = await this.executeAction(action);
      summaries.push(result.summary);
    }

    return summaries;
  }

  static async executeAction(action: GoogleAction): Promise<AutomationResult> {
    if (action.service === "calendar") {
      return this.executeCalendarAction(action);
    }

    if (action.service === "sheets") {
      return this.executeSheetsAction(action);
    }

    throw new Error(`Serviço Google não suportado: ${action.service}`);
  }

  private static async executeCalendarAction(action: GoogleAction): Promise<AutomationResult> {
    const calendarId = action.params.calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";
    const timeZone = action.params.timeZone || process.env.GOOGLE_TIMEZONE || "America/Sao_Paulo";

    if (action.operation === "create_event") {
      const start = action.params.start;
      const end = action.params.end;
      const summary = action.params.summary;

      if (!summary || !start || !end) {
        throw new Error("Ação de calendário incompleta: summary, start e end são obrigatórios.");
      }

      const event = await googleFetch<any>(`/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: "POST",
        body: JSON.stringify({
          summary,
          description: action.params.description,
          location: action.params.location,
          start: normalizeDatePayload(start, timeZone),
          end: normalizeDatePayload(end, timeZone),
        }),
      });

      return {
        summary: `Evento criado no Google Calendar: ${event.summary} (${event.htmlLink || "sem link"}).`,
      };
    }

    if (action.operation === "list_events") {
      const timeMin = action.params.timeMin || new Date().toISOString();
      const maxResults = Number(action.params.maxResults || 5);
      const timeMax = action.params.timeMax;

      const searchParams = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        timeMin,
        maxResults: String(maxResults),
      });

      if (timeMax) {
        searchParams.set("timeMax", timeMax);
      }

      const result = await googleFetch<any>(
        `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${searchParams.toString()}`
      );

      const items = Array.isArray(result.items) ? result.items : [];
      if (items.length === 0) {
        return { summary: "Nenhum evento encontrado no intervalo solicitado." };
      }

      const summary = items
        .map((item: any) => {
          const start = item.start?.dateTime || item.start?.date || "sem data";
          return `${item.summary || "Sem título"} em ${start}`;
        })
        .join("; ");

      return { summary: `Próximos eventos: ${summary}.` };
    }

    throw new Error(`Operação de calendário não suportada: ${action.operation}`);
  }

  private static async executeSheetsAction(action: GoogleAction): Promise<AutomationResult> {
    const spreadsheetId =
      resolveSpreadsheetId(action.params.spreadsheetId || action.params.spreadsheetRef) ||
      process.env.GOOGLE_SHEETS_DEFAULT_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error(
        "Nenhuma planilha definida. Informe spreadsheetId/spreadsheetRef ou configure GOOGLE_SHEETS_DEFAULT_SPREADSHEET_ID."
      );
    }

    if (action.operation === "append_row") {
      const values = Array.isArray(action.params.values)
        ? action.params.values
        : [action.params.values].filter(Boolean);
      const sheetName = action.params.sheetName || process.env.GOOGLE_SHEETS_DEFAULT_SHEET || "Página1";
      const range = action.params.range || `${sheetName}!A:Z`;

      if (values.length === 0) {
        throw new Error("Ação de planilha incompleta: values é obrigatório.");
      }

      const result = await googleFetch<any>(
        `/sheets/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          body: JSON.stringify({
            majorDimension: "ROWS",
            values: [values],
          }),
        }
      );

      return {
        summary: `Linha adicionada no Google Sheets em ${result.updates?.updatedRange || range}.`,
      };
    }

    if (action.operation === "read_range") {
      const range = action.params.range;

      if (!range) {
        throw new Error("Ação de planilha incompleta: range é obrigatório.");
      }

      const result = await googleFetch<any>(
        `/sheets/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
      );

      const rows = Array.isArray(result.values) ? result.values : [];
      if (rows.length === 0) {
        return { summary: `A faixa ${range} está vazia.` };
      }

      const preview = rows
        .slice(0, 3)
        .map((row: string[]) => row.join(" | "))
        .join("; ");

      return { summary: `Leitura de ${range}: ${preview}.` };
    }

    throw new Error(`Operação de planilha não suportada: ${action.operation}`);
  }
}
