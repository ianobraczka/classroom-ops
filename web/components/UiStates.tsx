export function LoadingCard({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-surface-card p-6 text-sm text-ink-500 shadow-sm">
      {label}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-surface-card p-8 text-center">
      <p className="font-medium text-ink-900">{title}</p>
      {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      {message}
    </div>
  );
}
