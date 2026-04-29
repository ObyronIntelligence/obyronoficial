import type { AuthResponse } from "@supabase/supabase-js";

export type EmailSignupState =
  | "created"
  | "existing_confirmed"
  | "existing_pending"
  | "unknown";

const EXISTING_REGISTERED_MESSAGES = ["user already registered"];
const PENDING_SIGNUP_AGE_THRESHOLD_MS = 30_000;

function messageLooksLikeRegisteredDuplicate(message: string | undefined) {
  if (!message) {
    return false;
  }

  const normalizedMessage = message.trim().toLowerCase();
  return EXISTING_REGISTERED_MESSAGES.some((candidate) => normalizedMessage.includes(candidate));
}

function createdEarlierThanThreshold(createdAt: string | undefined) {
  if (!createdAt) {
    return false;
  }

  const parsedCreatedAt = Date.parse(createdAt);

  if (Number.isNaN(parsedCreatedAt)) {
    return false;
  }

  return Date.now() - parsedCreatedAt > PENDING_SIGNUP_AGE_THRESHOLD_MS;
}

export function classifyEmailSignupState(response: AuthResponse): EmailSignupState {
  if (messageLooksLikeRegisteredDuplicate(response.error?.message)) {
    return "existing_confirmed";
  }

  const user = response.data.user;

  if (!user) {
    return response.error ? "unknown" : "created";
  }

  if ((user.identities ?? []).length === 0) {
    return "existing_confirmed";
  }

  if (!user.email_confirmed_at && createdEarlierThanThreshold(user.created_at)) {
    return "existing_pending";
  }

  return "created";
}
