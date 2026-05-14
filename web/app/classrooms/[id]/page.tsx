"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { Classroom } from "@/lib/types";
import { getUserId } from "@/lib/auth";
import { ErrorState, LoadingCard } from "@/components/UiStates";

export default function ClassroomDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const id = getUserId();
    if (!id) router.replace("/login");
    else setToken(id);
  }, [router]);

  const id = params.id;

  const q = useQuery({
    queryKey: ["classroom", id],
    queryFn: () => apiFetch<Classroom>(`/classrooms/${id}`, { method: "GET" }),
    enabled: !!token && !!id,
  });

  const archive = useMutation({
    mutationFn: () => apiFetch<Classroom>(`/classrooms/${id}/archive`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["classrooms"] });
      router.push("/classrooms");
    },
  });

  if (!token) return <LoadingCard label="Checking session…" />;
  if (q.isLoading) return <LoadingCard label="Loading classroom…" />;
  if (q.isError) return <ErrorState message={q.error instanceof Error ? q.error.message : "Failed to load"} />;

  const c = q.data!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Classroom</p>
          <h1 className="text-2xl font-semibold text-ink-950">{c.name}</h1>
          <p className="mt-2 text-sm text-ink-600">{c.description || "No description provided."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/classrooms/${c.id}/edit`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-ink-800 hover:bg-slate-50"
          >
            Edit
          </Link>
          {c.status === "active" ? (
            <button
              type="button"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
              disabled={archive.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    "Archive this classroom? It will disappear from your default list but is not deleted.",
                  )
                ) {
                  return;
                }
                archive.mutate();
              }}
            >
              {archive.isPending ? "Archiving…" : "Archive"}
            </button>
          ) : (
            <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-ink-700">Archived</span>
          )}
        </div>
      </div>

      {archive.isError ? (
        <ErrorState message={archive.error instanceof Error ? archive.error.message : "Archive failed"} />
      ) : null}

      <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Subject</dt>
          <dd className="mt-1 text-sm text-ink-900">{c.subject ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Grade level</dt>
          <dd className="mt-1 text-sm text-ink-900">{c.grade_level ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Academic year</dt>
          <dd className="mt-1 text-sm text-ink-900">{c.academic_year ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Status</dt>
          <dd className="mt-1 text-sm capitalize text-ink-900">{c.status}</dd>
        </div>
      </dl>

      <Link href="/classrooms" className="text-sm text-accent hover:underline">
        ← Back to classrooms
      </Link>
    </div>
  );
}
