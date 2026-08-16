import type { AxiosError } from "axios";

export const USER_TOKEN_KEY = "rentora_token";
export const AUTH_FAILURE_EVENT = "rentora:auth-failure";

export type AuthFailureKind = "session-ended" | "account-blocked";

type ErrorPayload = { message?: string | string[] };

function errorMessage(error: unknown) {
  const message = (error as AxiosError<ErrorPayload>)?.response?.data?.message;
  return Array.isArray(message) ? message[0] || "" : message || "";
}

export function getAuthFailureKind(error: unknown): AuthFailureKind | null {
  const axiosError = error as AxiosError<ErrorPayload>;
  const status = axiosError.response?.status;
  const message = errorMessage(error).toLowerCase();

  if (status === 401 && message.includes("your account has been blocked")) return "account-blocked";
  if (status === 403 && (
    message.includes("permanently banned") ||
    message.includes("навсегда заблокирован") ||
    message.includes("մշտապես արգելափակված")
  )) return "account-blocked";
  if (status === 401) return "session-ended";
  return null;
}

export function clearUserSession() {
  if (typeof window !== "undefined") localStorage.removeItem(USER_TOKEN_KEY);
}

export function emitAuthFailure(kind: AuthFailureKind) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AuthFailureKind>(AUTH_FAILURE_EVENT, { detail: kind }));
}
