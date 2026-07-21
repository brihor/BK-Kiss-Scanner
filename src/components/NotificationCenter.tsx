"use client";

import { useEffect, useRef, useState } from "react";
import type { FilterType } from "@/app/dashboard/page";
import type { Signal } from "@/types/signal";

type SignalCategory = Exclude<FilterType, "ALL">;

type NotificationItem = {
  id: string;
  signal: Signal;
  category: SignalCategory;
};

type Props = {
  signals: Signal[];
  activeFilter: FilterType;
  onViewCategory: (category: SignalCategory) => void;
};

function cleanPair(pair: string): string {
  return pair
    .replace(/^OANDA:/i, "")
    .replace(/[_/\-\s]/g, "")
    .trim()
    .toUpperCase();
}

function formatPair(pair: string): string {
  const cleanedPair = cleanPair(pair);

  if (cleanedPair === "XAUUSD") {
    return "XAU/USD";
  }

  if (cleanedPair === "XAGUSD") {
    return "XAG/USD";
  }

  if (cleanedPair.length === 6) {
    return `${cleanedPair.slice(0, 3)}/${cleanedPair.slice(3)}`;
  }

  return cleanedPair;
}

function getSignalCategory(pair: string): SignalCategory {
  const cleanedPair = cleanPair(pair);

  if (
    cleanedPair === "NAS100" ||
    cleanedPair === "NAS100USD" ||
    cleanedPair === "US30" ||
    cleanedPair === "US30USD"
  ) {
    return "INDICES";
  }

  if (
    cleanedPair === "XAUUSD" ||
    cleanedPair === "XAGUSD"
  ) {
    return "METALS";
  }

  return "FOREX";
}

export default function NotificationCenter({
  signals,
  activeFilter,
  onViewCategory,
}: Props) {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const knownSignalIds = useRef<Set<string>>(new Set());
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    const currentSignalIds = new Set(
      signals.map((signal) => signal.id)
    );

    if (!initialLoadComplete.current) {
      knownSignalIds.current = currentSignalIds;
      initialLoadComplete.current = true;
      return;
    }

    const newNotifications: NotificationItem[] = [];

    for (const signal of signals) {
      if (knownSignalIds.current.has(signal.id)) {
        continue;
      }

      const category = getSignalCategory(signal.pair);

      const signalIsVisible =
        activeFilter === "ALL" ||
        activeFilter === category;

      if (!signalIsVisible) {
        newNotifications.push({
          id: signal.id,
          signal,
          category,
        });
      }
    }

    knownSignalIds.current = currentSignalIds;

    if (newNotifications.length === 0) {
      return;
    }

    setNotifications((current) => [
      ...current,
      ...newNotifications,
    ]);

    const timeoutIds = newNotifications.map(
      (notification) =>
        window.setTimeout(() => {
          setNotifications((current) =>
            current.filter(
              (item) => item.id !== notification.id
            )
          );
        }, 8000)
    );

    return () => {
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, [signals, activeFilter]);

  function dismissNotification(id: string) {
    setNotifications((current) =>
      current.filter(
        (notification) => notification.id !== id
      )
    );
  }

  function viewNotification(
    notification: NotificationItem
  ) {
    onViewCategory(notification.category);
    dismissNotification(notification.id);
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-5 top-5 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {notifications.map((notification) => {
        const direction =
          notification.signal.direction ??
          notification.signal.signal;

        const categoryLabel =
          notification.category.charAt(0) +
          notification.category.slice(1).toLowerCase();

        return (
          <div
            key={notification.id}
            className="overflow-hidden rounded-xl border border-red-900/70 bg-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_22px_rgba(239,68,68,0.16)]"
          >
            <div className="flex items-start gap-4 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-red-900/70 bg-red-950/40 text-red-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M3 17l5-5 4 4 8-9" />
                  <path d="M14 7h6v6" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">
                  New KiSS Signal
                </p>

                <p className="mt-1 text-lg font-bold text-white">
                  {formatPair(notification.signal.pair)}{" "}
                  <span
                    className={
                      direction === "BUY"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {direction}
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() =>
                    viewNotification(notification)
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:border-red-700 hover:bg-red-950/40"
                >
                  View {categoryLabel}
                  <span aria-hidden="true">→</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  dismissNotification(notification.id)
                }
                className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Dismiss notification"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}