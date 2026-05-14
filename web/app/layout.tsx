import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppNav } from "@/components/AppNav";

export const metadata: Metadata = {
  title: "Classroom Ops",
  description: "Classroom operations dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-10 pt-6">
            <AppNav />
            <main className="mt-6 flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
