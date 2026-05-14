"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { Classroom } from "@/lib/types";
import { getUserId } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingCard } from "@/components/UiStates";

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const id = getUserId();
    if (!id) router.replace("/login");
    else setToken(id);
  }, [router]);

  const q = useQuery({
    queryKey: ["classrooms"],
    queryFn: () => apiFetch<Classroom[]>("/classrooms", { method: "GET" }),
    enabled: !!token,
  });

  if (!token) return <LoadingCard label="Checking session…" />;
  if (q.isLoading) return <LoadingCard label="Loading classrooms…" />;
  if (q.isError) return <ErrorState message={q.error instanceof Error ? q.error.message : "Failed to load"} />;

  const active = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-950">Dashboard</h1>
          <p className="text-sm text-ink-500">Active workspaces you own.</p>
        </div>
        <Link
          href="/classrooms/new"
          className="inline-flex w-fit items-center rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Create classroom
        </Link>
      </div>

      {active.length === 0 ? (
        <EmptyState
          title="No active classrooms yet"
          hint="Create a classroom to see it appear here. Archived rooms stay hidden from this list."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {active.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/classrooms/${c.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-accent hover:shadow-md"
            >
              <p className="font-semibold text-ink-950">{c.name}</p>
              <p className="mt-1 text-sm text-ink-500">{c.subject ?? "No subject"}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-ink-700 shadow-sm">
        <p>
          You have <span className="font-semibold">{active.length}</span> active classroom
          {active.length === 1 ? "" : "s"}.
        </p>
        <Link href="/classrooms" className="mt-2 inline-block text-accent hover:underline">
          View all classrooms
        </Link>
      </div>
    </div>
  );
}
