import { getUserId } from "@/lib/auth";

const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiFetchOptions = RequestInit & {
  /** Skip attaching X-User-Id (e.g. public /users for mock login). */
  skipUserHeader?: boolean;
};

export async function apiFetch<T = unknown>(path: string, init: ApiFetchOptions = {}): Promise<T> {
  const { skipUserHeader, ...rest } = init;
  const headers = new Headers(rest.headers);

  if (!skipUserHeader) {
    const uid = getUserId();
    if (uid) headers.set("X-User-Id", uid);
  }

  if (rest.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${base()}${path}`, { ...rest, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
      else if (Array.isArray(body?.detail)) detail = body.detail.map((d: { msg?: string }) => d.msg).join(", ");
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as T;
}
