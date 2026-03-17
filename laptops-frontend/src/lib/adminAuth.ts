export const ADMIN_SESSION_KEY = "lapstore-admin-session";

const ADMIN_EMAIL = "admin@lapstore.local";
const ADMIN_PASSWORD = "LapStore123!";

export function validateAdminCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export function createAdminSessionToken(): string {
  return `adm_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function getAdminHintCredentials() {
  return {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  };
}
