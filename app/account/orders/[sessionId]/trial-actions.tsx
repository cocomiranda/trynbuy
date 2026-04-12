"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TrialActionsProps = {
  beforePhotosCount: number;
  dueDate?: string;
  dueLabel?: string;
  initialReturnRequested?: boolean;
  returnedDate?: string;
  returnPhotosCount: number;
  sessionId: string;
  upgradeAmount: number | null;
  upgradeHref?: string;
};

export function TrialActions({
  beforePhotosCount,
  dueDate,
  dueLabel,
  initialReturnRequested = false,
  returnedDate,
  returnPhotosCount,
  sessionId,
  upgradeAmount,
  upgradeHref,
}: TrialActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(initialReturnRequested);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countdown = dueLabel
    ?.replace("Due in ", "in ")
    .replace("Return window ended", "ended");
  const hasBeforePhotos = beforePhotosCount > 0;
  const hasReturnPhotos = returnPhotosCount > 0;
  const canConfirmReturn = hasBeforePhotos && hasReturnPhotos;

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("sessionId", sessionId);
      formData.set("notes", notes);

      const response = await fetch("/api/trial-return", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not confirm the return.");
      }

      setSubmitted(true);
      setIsOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not confirm the return.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {submitted ? (
          <div className="inline-flex max-w-full rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <p>Returned on {returnedDate ?? "Not available"}</p>
          </div>
        ) : (
          <div className="inline-flex max-w-full rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            <p>
              Due date {dueDate}{" "}
              <span className="font-semibold">({countdown})</span>
            </p>
          </div>
        )}
        {!submitted ? (
          <button
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            Return now
          </button>
        ) : null}
        {!submitted && upgradeAmount !== null && upgradeHref ? (
          <Link
            href={upgradeHref}
            className="inline-flex items-center justify-center rounded-full bg-[#1769e8] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0f58ca]"
          >
            Buy now for ${upgradeAmount}
          </Link>
        ) : null}
      </div>

      {submitted ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          Returned. Pending inspection.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/45 px-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_-30px_rgba(41,37,36,0.35)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                  Return confirmation
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                  Return this pair
                </h2>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition hover:bg-stone-100"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-7 text-stone-600">
              <p>
                Confirm that you&apos;re ready to return the pair and we&apos;ll
                mark this trial for inspection.
              </p>
              <div className="space-y-2">
                <p
                  className={`font-medium ${
                    hasBeforePhotos ? "text-stone-700" : "text-red-600"
                  }`}
                >
                  {hasBeforePhotos
                    ? `${beforePhotosCount} before photo${
                        beforePhotosCount === 1 ? "" : "s"
                      } uploaded.`
                    : "No before photos uploaded yet."}
                </p>
                <p
                  className={`font-medium ${
                    hasReturnPhotos ? "text-stone-700" : "text-red-600"
                  }`}
                >
                  {hasReturnPhotos
                    ? `${returnPhotosCount} return photo${
                        returnPhotosCount === 1 ? "" : "s"
                      } uploaded.`
                    : "No return photos uploaded yet."}
                </p>
              </div>
              {!canConfirmReturn ? (
                <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-600">
                  Upload both before and return photos before confirming the
                  return.
                </div>
              ) : null}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-stone-800">
                Notes for inspection
              </span>
              <textarea
                className="mt-2 min-h-[120px] w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional: mention anything useful about wear, cleaning, or return photos."
                value={notes}
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
                disabled={isSubmitting || !canConfirmReturn}
                onClick={handleConfirm}
                type="button"
              >
                {isSubmitting ? "Confirming..." : "Confirm return"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
