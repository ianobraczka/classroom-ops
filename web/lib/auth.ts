const USER_KEY = "cop-user-id";

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(USER_KEY);
}

export function setUserId(id: string) {
  window.localStorage.setItem(USER_KEY, id);
}

export function clearUserId() {
  window.localStorage.removeItem(USER_KEY);
}
