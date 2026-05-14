"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getUserId } from "@/lib/auth";
import { LoadingCard } from "@/components/UiStates";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getUserId() ? "/dashboard" : "/login");
  }, [router]);

  return <LoadingCard label="Redirecting…" />;
}
