import type { Locale } from "./types";

/**
 * Per-charge explanations for the cost breakdown. Kept beside the other detail
 * copy rather than on CostItem so the mock data stays a pure data file.
 *
 * Papikos never processes payment (AGENTS.md rules out payment processing,
 * deposits, invoices, and stored payment methods), so these strings explain
 * how a charge is calculated and say plainly that money is settled directly
 * with the owner.
 */

export interface CostExplanation {
  title: string;
  body: string;
  points: string[];
}

const fallback: Record<Locale, CostExplanation> = {
  id: {
    title: "Tentang biaya ini",
    body: "Biaya ini ditampilkan apa adanya dari pemilik kos.",
    points: [
      "Papikos tidak menambahkan biaya layanan apa pun.",
      "Konfirmasi ulang dengan pemilik sebelum pindah.",
    ],
  },
  en: {
    title: "About this charge",
    body: "This charge is shown exactly as the owner listed it.",
    points: [
      "Papikos adds no service fee of its own.",
      "Confirm with the owner before you move in.",
    ],
  },
};

export const costExplanations: Record<
  Locale,
  Record<string, CostExplanation>
> = {
  id: {
    water: {
      title: "Air",
      body: "Air sudah termasuk dalam harga sewa bulanan.",
      points: [
        "Tidak ada tagihan air terpisah.",
        "Pemakaian wajar mengikuti aturan kos.",
      ],
    },
    electricity: {
      title: "Listrik",
      body: "Listrik dihitung terpisah mengikuti meteran di kamarmu.",
      points: [
        "Tagihan mengikuti pemakaian, jadi berubah tiap bulan.",
        "Perangkat berdaya besar seperti AC menaikkan tagihan.",
        "Minta contoh tagihan bulan lalu kepada pemilik.",
      ],
    },
    parking: {
      title: "Parkir motor",
      body: "Biaya tetap per bulan untuk satu slot parkir motor.",
      points: [
        "Ditagih bersama sewa bulanan.",
        "Slot mobil biasanya tidak tersedia di kos.",
      ],
    },
    deposit: {
      title: "Deposit",
      body: "Kos ini tidak meminta deposit di muka.",
      points: [
        "Papikos tidak pernah menerima atau menyimpan uang.",
        "Kerusakan tetap menjadi tanggung jawab penghuni sesuai aturan kos.",
      ],
    },
  },
  en: {
    water: {
      title: "Water",
      body: "Water is already included in the monthly rent.",
      points: [
        "There is no separate water bill.",
        "Reasonable use follows the house rules.",
      ],
    },
    electricity: {
      title: "Electricity",
      body: "Electricity is billed separately from your room's meter.",
      points: [
        "The bill follows your usage, so it varies month to month.",
        "High-draw appliances such as air conditioning raise it.",
        "Ask the owner for a recent bill as a reference.",
      ],
    },
    parking: {
      title: "Motorbike parking",
      body: "A fixed monthly charge for one motorbike parking slot.",
      points: [
        "Billed together with the monthly rent.",
        "Car slots are usually not available at a kos.",
      ],
    },
    deposit: {
      title: "Deposit",
      body: "This kos does not ask for a deposit up front.",
      points: [
        "Papikos never receives or holds money.",
        "Damage remains the resident's responsibility under the house rules.",
      ],
    },
  },
};

export const costPaymentNotice: Record<Locale, string> = {
  id: "Semua pembayaran diatur langsung dengan pemilik kos. Papikos tidak memproses pembayaran dan tidak menyimpan metode pembayaran apa pun.",
  en: "All payment is arranged directly with the owner. Papikos does not process payments and stores no payment methods.",
};

export function costExplanationFor(
  costId: string,
  locale: Locale,
): CostExplanation {
  return costExplanations[locale][costId] ?? fallback[locale];
}
