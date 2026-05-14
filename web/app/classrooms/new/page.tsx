"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api/client";
import type { Classroom } from "@/lib/types";
import { classroomFormSchema, emptyClassroomForm, type ClassroomFormValues } from "@/lib/schemas/classroom";
import { getUserId } from "@/lib/auth";
import { ErrorState, LoadingCard } from "@/components/UiStates";

function toApiBody(values: ClassroomFormValues) {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    subject: values.subject?.trim() ? values.subject.trim() : null,
    grade_level: values.grade_level?.trim() ? values.grade_level.trim() : null,
    academic_year: values.academic_year?.trim() ? values.academic_year.trim() : null,
  };
}

export default function NewClassroomPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const id = getUserId();
    if (!id) router.replace("/login");
    else setToken(id);
  }, [router]);

  const form = useForm<ClassroomFormValues>({
    resolver: zodResolver(classroomFormSchema),
    defaultValues: emptyClassroomForm(),
  });

  const mutation = useMutation({
    mutationFn: (values: ClassroomFormValues) =>
      apiFetch<Classroom>("/classrooms", { method: "POST", body: JSON.stringify(toApiBody(values)) }),
    onSuccess: async (c) => {
      await qc.invalidateQueries({ queryKey: ["classrooms"] });
      router.push(`/classrooms/${c.id}`);
    },
  });

  if (!token) return <LoadingCard label="Checking session…" />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-950">New classroom</h1>
        <p className="text-sm text-ink-500">Create a workspace for your teaching context.</p>
      </div>

      {mutation.isError ? (
        <ErrorState message={mutation.error instanceof Error ? mutation.error.message : "Could not create"} />
      ) : null}

      <form
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <Field label="Name" error={form.formState.errors.name?.message}>
          <input className={inputClass} {...form.register("name")} />
        </Field>
        <Field label="Description" error={form.formState.errors.description?.message}>
          <textarea className={`${inputClass} min-h-[96px]`} {...form.register("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject" error={form.formState.errors.subject?.message}>
            <input className={inputClass} {...form.register("subject")} />
          </Field>
          <Field label="Grade level" error={form.formState.errors.grade_level?.message}>
            <input className={inputClass} {...form.register("grade_level")} />
          </Field>
        </div>
        <Field label="Academic year" error={form.formState.errors.academic_year?.message}>
          <input className={inputClass} {...form.register("academic_year")} placeholder="2025-2026" />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : "Create classroom"}
          </button>
          <Link href="/classrooms" className="text-sm text-ink-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-ink-700">
      {label}
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
