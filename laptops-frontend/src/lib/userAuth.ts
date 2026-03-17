export const USER_SESSION_KEY = "lapstore-user-session";
const USER_EXPLICIT_LOGOUT_KEY = "lapstore-user-explicit-logout";
const REGISTERED_USERS_KEY = "lapstore-registered-users";
const DEMO_USER_EMAIL = "demo@lapstore.local";
const DEMO_USER_PASSWORD = "LapStoreDemo2026!";

type RegisteredUserRecord = {
  email: string;
  password: string;
};

function generateUserSessionToken(): string {
  return `usr_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function getDemoUserCredentials() {
  return {
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
  };
}

export function validateDemoUserCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD;
}

function getRegisteredUsers(): RegisteredUserRecord[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RegisteredUserRecord =>
        typeof entry?.email === "string" && typeof entry?.password === "string",
    );
  } catch {
    return [];
  }
}

export function registerUserCredentials(email: string, password: string): void {
  if (typeof window === "undefined") return;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return;

  const current = getRegisteredUsers().filter((entry) => entry.email !== normalizedEmail);
  const next: RegisteredUserRecord[] = [...current, { email: normalizedEmail, password }];
  window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(next));
}

function validateRegisteredUserCredentials(email: string, password: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return false;
  return getRegisteredUsers().some((entry) => entry.email === normalizedEmail && entry.password === password);
}

export function validateLoginCredentials(email: string, password: string): boolean {
  return validateDemoUserCredentials(email, password) || validateRegisteredUserCredentials(email, password);
}

export function hasUserSession(): boolean {
  if (typeof window === "undefined") return false;

  const existing = window.localStorage.getItem(USER_SESSION_KEY);
  if (existing) return true;

  const explicitlyLoggedOut = window.localStorage.getItem(USER_EXPLICIT_LOGOUT_KEY) === "1";
  if (explicitlyLoggedOut) return false;

  const token = generateUserSessionToken();
  window.localStorage.setItem(USER_SESSION_KEY, token);
  return true;
}

export function createUserSession(): string {
  const token = generateUserSessionToken();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_SESSION_KEY, token);
    window.localStorage.removeItem(USER_EXPLICIT_LOGOUT_KEY);
  }
  return token;
}

export function clearUserSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_SESSION_KEY);
  window.localStorage.setItem(USER_EXPLICIT_LOGOUT_KEY, "1");
}
