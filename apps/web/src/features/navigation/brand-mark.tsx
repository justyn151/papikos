import { Building2 } from "lucide-react";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Papikos">
      <span className="grid size-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
        <Building2 size={21} strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span
        className={`brand-wordmark text-xl font-black tracking-[-0.04em] ${
          inverse ? "text-white" : "text-slate-950 dark:text-slate-50"
        }`}
      >
        papi<span className={inverse ? "text-cyan-300" : "text-blue-600 dark:text-blue-400"}>kos</span>
      </span>
    </span>
  );
}
