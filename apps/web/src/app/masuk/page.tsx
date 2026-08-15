import type { Metadata } from "next";

import { LoginPage } from "@/features/auth/login-page";

export const metadata: Metadata = {
  title: "Masuk — Papikos",
  description: "Masuk ke akun Papikos untuk menyimpan favorit dan mengajukan sewa.",
};

export default function LoginRoute() {
  return <LoginPage />;
}
