import type { Metadata } from "next";

import { RegisterPage } from "@/features/auth/register-page";

export const metadata: Metadata = {
  title: "Daftar — Papikos",
  description: "Buat akun Papikos sebagai pencari kos atau pemilik kos.",
};

export default function RegisterRoute() {
  return <RegisterPage />;
}
