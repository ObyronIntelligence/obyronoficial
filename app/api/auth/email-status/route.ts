import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";

type EmailStatus =
  | {
      available: true;
      providers: string[];
      status: "confirmed" | "pending";
    }
  | {
      available: true;
      providers: [];
      status: "not_found";
    }
  | {
      available: false;
      reason: "admin_not_configured";
    };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUserStatus(user: User): Extract<EmailStatus, { available: true; status: "confirmed" | "pending" }> {
  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers.filter((provider): provider is string => typeof provider === "string" && provider.length > 0)
    : typeof user.app_metadata.provider === "string" && user.app_metadata.provider.length > 0
      ? [user.app_metadata.provider]
      : [];

  return {
    available: true,
    status: user.email_confirmed_at ? "confirmed" : "pending",
    providers,
  };
}

async function findUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  let page = 1;

  while (true) {
    const response = await supabase.auth.admin.listUsers({ page, perPage: 1000 });

    if (response.error) {
      throw response.error;
    }

    const matchedUser = response.data.users.find(
      (user) => normalizeEmail(user.email ?? "") === email,
    );

    if (matchedUser) {
      return matchedUser;
    }

    if (!response.data.nextPage || page >= response.data.lastPage) {
      return null;
    }

    page = response.data.nextPage;
  }
}

export async function POST(request: Request) {
  const { configured } = getSupabaseAdminEnv();

  if (!configured) {
    return NextResponse.json<EmailStatus>(
      {
        available: false,
        reason: "admin_not_configured",
      },
      { status: 503 },
    );
  }

  let body: { email?: unknown } = {};

  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const email = normalizeEmail(rawEmail);

  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatorio." }, { status: 400 });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json<EmailStatus>({
        available: true,
        status: "not_found",
        providers: [],
      });
    }

    return NextResponse.json<EmailStatus>(mapUserStatus(user));
  } catch (error) {
    console.error("Falha ao verificar o status do e-mail no Supabase.", error);
    return NextResponse.json({ error: "Nao foi possivel validar o e-mail agora." }, { status: 500 });
  }
}
