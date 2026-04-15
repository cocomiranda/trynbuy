"use client";

import { useState } from "react";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-6 lg:inset-x-10">
      <div className="pointer-events-auto flex w-full max-w-sm justify-end">
        {isOpen ? (
          <div className="rounded-[1.5rem] border border-stone-900/10 bg-white/95 p-4 shadow-[0_18px_40px_-24px_rgba(28,25,23,0.35)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Feedback
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Spotted something to improve? Drop us a quick note.
                </p>
              </div>
              <button
                aria-label="Close feedback box"
                className="rounded-full border border-stone-200 px-3 py-1 text-sm text-stone-600 hover:bg-stone-50"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <textarea
              className="mt-4 min-h-[104px] w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-stone-400"
              placeholder="Share a bug, idea, or anything that feels unclear."
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-stone-500">Submission coming soon</p>
              <button
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white opacity-60"
                disabled
                type="button"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <button
            aria-label="Open feedback"
            className="ml-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#5c5cff] text-white shadow-[0_18px_36px_-20px_rgba(58,76,255,0.55)] hover:bg-[#4d4df4]"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 10.5h8M8 14h4M7 5h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-4.2L8.8 20a.8.8 0 0 1-1.3-.62V17A3 3 0 0 1 4 14V8a3 3 0 0 1 3-3Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
