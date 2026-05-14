"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearUserId, getUserId } from "@/lib/auth";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/classrooms", label: "Classrooms" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    setUid(getUserId());
  }, [pathname]);

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-lg font-semibold text-ink-950">
          Classroom Ops
        </Link>
        <p className="text-sm text-ink-500">Teacher workspace console</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {uid ? (
          <>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  pathname === l.href ? "bg-slate-900 text-white" : "text-ink-700 hover:bg-slate-100",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/classrooms/new"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              New classroom
            </Link>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-ink-700 hover:bg-slate-50"
              onClick={() => {
                clearUserId();
                setUid(null);
                router.push("/login");
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm font-medium text-accent hover:underline">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
