import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function resolveRedirectUri(request: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || new URL("/api/google/oauth/callback", request.url).toString();
}

function upsertEnvValue(source: string, key: string, value: string) {
  const escapedValue = value.replace(/\r?\n/g, "");
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(source)) {
    return source.replace(pattern, `${key}=${escapedValue}`);
  }

  return `${source.trimEnd()}\n${key}=${escapedValue}\n`;
}

async function persistRefreshToken(refreshToken: string) {
  const envPath = path.join(process.cwd(), ".env.local");
  const currentEnv = await fs.readFile(envPath, "utf8").catch(() => "");
  const nextEnv = upsertEnvValue(currentEnv, "GOOGLE_REFRESH_TOKEN", refreshToken);
  await fs.writeFile(envPath, nextEnv, "utf8");
  process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(`Autorizacao Google cancelada ou negada: ${error}`, { status: 400 });
  }

  if (!code) {
    return new NextResponse("Codigo de autorizacao ausente.", { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse("GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET ausente no .env.local.", {
      status: 400,
    });
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: resolveRedirectUri(request),
      grant_type: "authorization_code",
    }),
  });

  const payload = await tokenResponse.json().catch(() => null);

  if (!tokenResponse.ok) {
    return NextResponse.json(
      { error: payload?.error_description || payload?.error || "Falha ao trocar codigo por token." },
      { status: 400 },
    );
  }

  if (!payload?.refresh_token) {
    return new NextResponse(
      "Autorizacao concluida, mas o Google nao retornou refresh_token. Acesse /api/google/oauth/start novamente; se persistir, remova o acesso do app na sua Conta Google e autorize de novo.",
      { status: 400 },
    );
  }

  await persistRefreshToken(payload.refresh_token);

  return new NextResponse(
    [
      "Google Calendar conectado com sucesso.",
      "O refresh token foi salvo no .env.local.",
      "A automacao ja pode usar a agenda nesta sessao.",
    ].join("\n"),
    { status: 200 },
  );
}
