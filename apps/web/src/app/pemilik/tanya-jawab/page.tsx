import type { Metadata } from "next";

import { OwnerQuestionsPage } from "@/features/owner/owner-questions-page";

export const metadata: Metadata = {
  title: "Tanya jawab — Papikos",
  description: "Jawab pertanyaan penyewa secara asinkron.",
};

export default function Route() {
  return <OwnerQuestionsPage />;
}
