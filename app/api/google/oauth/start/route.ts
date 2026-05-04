import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_CALENDAR_SCOPES } from "@/lib/actions/google-automation";

function resolveRedirectUri(request: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || new URL("/api/google/oauth/callback", request.url).toString();
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId.includes("your-google")) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID nao configurado no .env.local." },
      { status: 400 },
    );
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", resolveRedirectUri(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_CALENDAR_SCOPES.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");

  return NextResponse.redirect(authUrl);
}
