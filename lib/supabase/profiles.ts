import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileRow = {
  client_id: number;
  created_at: string;
  email: string;
  full_name: string | null;
  id: string;
  updated_at: string;
  username: string | null;
};

export interface ClientProfile {
  clientId: number;
  createdAt: string;
  email: string;
  fullName: string | null;
  id: string;
  updatedAt: string;
  username: string | null;
}

const PROFILE_SELECT = "id, client_id, email, username, full_name, created_at, updated_at";

function mapProfileRow(row: ProfileRow): ClientProfile {
  return {
    id: row.id,
    clientId: row.client_id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchProfileByUserId(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205") {
      return null;
    }

    throw error;
  }

  return data ? mapProfileRow(data as ProfileRow) : null;
}
