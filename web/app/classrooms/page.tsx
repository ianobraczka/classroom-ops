"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { Classroom } from "@/lib/types";
import { getUserId } from "@/lib/auth";
import { EmptyState, ErrorState, LoadingCard } from "@/components/UiStates";

export default function ClassroomsPage() {
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

  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-950">Classrooms</h1>
          <p className="text-sm text-ink-500">Active workspaces. Archived rooms are hidden here.</p>
        </div>
        <Link
          href="/classrooms/new"
          className="inline-flex w-fit items-center rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          New classroom
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No classrooms yet" hint="Create your first workspace to get started." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                  <td className="px-4 py-3 text-ink-600">{c.subject ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{c.grade_level ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{c.academic_year ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/classrooms/${c.id}`} className="text-accent hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
