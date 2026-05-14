"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import type { User } from "@/lib/types";
import { getUserId, setUserId } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingCard } from "@/components/UiStates";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (getUserId()) router.replace("/dashboard");
  }, [router]);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/users", { method: "GET", skipUserHeader: true }),
  });

  if (usersQuery.isLoading) return <LoadingCard label="Loading users…" />;
  if (usersQuery.isError)
    return <ErrorState message={usersQuery.error instanceof Error ? usersQuery.error.message : "Failed to load users"} />;
  if (!usersQuery.data?.length) return <EmptyState title="No users found" hint="Seed the API database (see README)." />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-950">Mock sign-in</h1>
        <p className="mt-2 text-sm text-ink-500">
          Pick a user to attach the <code className="rounded bg-slate-100 px-1">X-User-Id</code> header for this browser
          session.
        </p>
      </div>
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {usersQuery.data.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
              onClick={() => {
                setUserId(u.id);
                router.push("/dashboard");
              }}
            >
              <span>
                <span className="block font-medium text-ink-900">{u.full_name}</span>
                <span className="text-sm text-ink-500">{u.email}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-ink-700">
                {u.role}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
