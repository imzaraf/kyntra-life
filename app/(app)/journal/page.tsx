import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { JournalWorkspace } from "@/features/journal/journal-workspace";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <>
      <PageHeader
        eyebrow="Journal"
        title="Write it down."
        description="A private page for every day. Saved as you write, searchable forever."
      />
      <Suspense>
        <JournalWorkspace />
      </Suspense>
    </>
  );
}
