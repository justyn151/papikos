"use client";

import { CircleHelp, Send } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { accountCopy } from "@/features/account/account-copy";
import { StatusBadge } from "@/features/account/requests-page";
import { getListingDetail } from "@/features/listings/mock-listings";
import { ConsoleShell } from "@/features/navigation/console-shell";
import { useAuditLog, useQuestions } from "@/features/prototype-data/store";
import { questionStatusLabels } from "@/features/prototype-data/status-copy";
import { answerQuestion } from "@/features/prototype-data/transitions";

import { ownerCopy } from "./owner-copy";
import { ownerNavItems } from "./owner-nav";

export function OwnerQuestionsPage() {
  const { questions, replace } = useQuestions();
  const { append } = useAuditLog();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const pendingCount = questions.filter(
    (question) => question.status === "pending",
  ).length;

  return (
    <ConsoleShell
      activeId="questions"
      areaLabel={(locale) => ownerCopy[locale].area}
      items={(locale) => ownerNavItems(locale, { questions: pendingCount })}
      toast={toast}
    >
      {(locale) => {
        const t = ownerCopy[locale];
        const a = accountCopy[locale];
        const dateFormatter = new Intl.DateTimeFormat(
          locale === "id" ? "id-ID" : "en-GB",
          { day: "numeric", month: "short", year: "numeric" },
        );
        const formatDate = (value: string) => {
          const parsed = new Date(value);
          return Number.isNaN(parsed.valueOf())
            ? value
            : dateFormatter.format(parsed);
        };

        const submit = (event: FormEvent<HTMLFormElement>, id: string) => {
          event.preventDefault();
          const question = questions.find((item) => item.id === id);
          if (!question) return;
          const result = answerQuestion(question, drafts[id] ?? "");
          if (!result) return;
          replace(result.record);
          append(result.audit);
          setDrafts((current) => ({ ...current, [id]: "" }));
          setToast(t.answeredToast);
          window.setTimeout(() => setToast(""), 2600);
        };

        return (
          <>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t.questionsTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t.questionsBody}
            </p>


            {questions.length === 0 ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-16 text-center dark:bg-blue-950/35">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
                  <CircleHelp size={24} aria-hidden="true" />
                </span>
                <p className="mt-5 text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t.questionsEmpty}
                </p>
              </div>
            ) : (
              <ul className="mt-8 grid gap-4">
                {questions.map((question) => {
                  const listing = getListingDetail(question.listingId);
                  return (
                    <li
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
                      key={question.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
                            {listing?.name ?? question.listingId}
                          </h2>
                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t.askedOn} {formatDate(question.createdAt)}
                          </p>
                        </div>
                        <StatusBadge
                          status={question.status}
                          label={questionStatusLabels[locale][question.status]}
                        />
                      </div>

                      <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                        {question.question}
                      </p>

                      {question.status === "answered" ? (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/35">
                          <p className="text-xs font-black uppercase tracking-[0.06em] text-emerald-800 dark:text-emerald-300">
                            {t.yourAnswer}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                            {question.answer}
                          </p>
                        </div>
                      ) : (
                        <form
                          className="mt-4 grid gap-2"
                          onSubmit={(event) => submit(event, question.id)}
                        >
                          <label className="sr-only" htmlFor={`answer-${question.id}`}>
                            {t.yourAnswer}
                          </label>
                          <textarea
                            className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            id={`answer-${question.id}`}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [question.id]: event.target.value,
                              }))
                            }
                            placeholder={t.answerPlaceholder}
                            value={drafts[question.id] ?? ""}
                          />
                          <button
                            className="btn-primary justify-self-start gap-2"
                            disabled={!(drafts[question.id] ?? "").trim()}
                            type="submit"
                          >
                            <Send size={16} aria-hidden="true" />
                            {t.sendAnswer}
                          </button>
                        </form>
                      )}

                      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <Link
                          className="btn-secondary"
                          href={`/kos/${question.listingId}`}
                        >
                          {a.viewListing}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        );
      }}
    </ConsoleShell>
  );
}
