import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import HomePage from "@/components/home/HomePage";
import { getSeoSettings, buildMetadata } from "@/lib/seo-settings";

export async function generateMetadata(): Promise<Metadata> {
  try {
    return buildMetadata(await getSeoSettings())
  } catch {
    return buildMetadata(await getSeoSettings())
  }
}

export default function Home() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        }
      >
        <HomePage />
      </Suspense>
    </AppShell>
  );
}
