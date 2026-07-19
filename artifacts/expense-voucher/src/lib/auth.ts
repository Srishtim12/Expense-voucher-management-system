import { User } from "@workspace/api-client-react";

export function getToken(): string | null {
  return localStorage.getItem("ev_token");
}

export function setToken(token: string): void {
  localStorage.setItem("ev_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("ev_token");
}

export function getUser(): User | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload);
    return JSON.parse(decoded) as User;
  } catch (e) {
    return null;
  }
}
