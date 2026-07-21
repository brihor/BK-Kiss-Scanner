"use client";

import { useEffect, useMemo, useState } from "react";
import type { FilterType } from "@/app/dashboard/page";
import type { Signal } from "@/types/signal";

import SignalRow from "./SignalRow";
import NotificationCenter from "./NotificationCenter";
import SoundManager from "./SoundManager";

type Props = {
  activeFilter: FilterType;
  searchTerm: string;
  onViewCategory: (
    category: Exclude<FilterType, "ALL">
  ) => void;
};

function cleanPair(pair: string): string {
  return pair
    .replace(/^OANDA:/i, "")
    .replace(/[_/\-\s]/g, "")
    .trim()
    .toUpperCase();
}

function isMetal(pair: string): boolean {
  const cleanedPair = cleanPair(pair);

  return (
    cleanedPair.startsWith("XAU") ||
    cleanedPair.startsWith("XAG")
  );
}

function isIndex(pair: string): boolean {
  const cleanedPair = cleanPair(pair);

  return (
    cleanedPair === "NAS100" ||
    cleanedPair === "NAS100USD" ||
    cleanedPair === "US30" ||
    cleanedPair === "US30USD"
  );
}

function matchesSearch(
  pair: string,
  searchTerm: string
): boolean {
  const cleanedPair = cleanPair(pair);

  const cleanedSearch = searchTerm
    .replace(/[_/\-\s]/g, "")
    .trim()
    .toUpperCase();

  if (!cleanedSearch) {
    return true;
  }

  const searchableTerms = [cleanedPair];

  if (cleanedPair.startsWith("XAU")) {
    searchableTerms.push("GOLD");
  }

  if (cleanedPair.startsWith("XAG")) {
    searchableTerms.push("SILVER");
  }

  if (cleanedPair.startsWith("NAS100")) {
    searchableTerms.push(
      "NASDAQ",
      "NASDAQ100"
    );
  }

  if (cleanedPair.startsWith("US30")) {
    searchableTerms.push(
      "DOW",
      "DOWJONES"
    );
  }

  return searchableTerms.some((term) =>
    term.includes(cleanedSearch)
  );
}

export default function ScannerTable({
  activeFilter,
  searchTerm,
  onViewCategory,
}: Props) {
  const [signals, setSignals] = useState<
    Signal[]
  >([]);

  const [now, setNow] = useState(() =>
    Date.now()
  );

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSignals() {
      try {
        const response = await fetch(
          "/api/signals",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load signals."
          );
        }

        const data = await response.json();

        const loadedSignals: Signal[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data.signals)
              ? data.signals
              : [];

        if (isMounted) {
          setSignals(loadedSignals);
        }
      } catch (error) {
        console.error(
          "Scanner signal error:",
          error
        );

        if (isMounted) {
          setSignals([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSignals();

    const interval = window.setInterval(
      loadSignals,
      5000
    );

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      const pair = signal.pair;

      const matchesCategory =
        activeFilter === "ALL" ||
        (activeFilter === "METALS" &&
          isMetal(pair)) ||
        (activeFilter === "INDICES" &&
          isIndex(pair)) ||
        (activeFilter === "FOREX" &&
          !isMetal(pair) &&
          !isIndex(pair));

      return (
        matchesCategory &&
        matchesSearch(
          pair,
          searchTerm
        )
      );
    });
  }, [
    signals,
    activeFilter,
    searchTerm,
  ]);

  function getEmptyMessage(): string {
    if (isLoading) {
      return "Loading active signals...";
    }

    if (signals.length === 0) {
      return "No active signals right now.";
    }

    if (searchTerm.trim()) {
      return "No signals match your search.";
    }

    return `No active ${activeFilter.toLowerCase()} signals right now.`;
  }

  return (
    <>
      <NotificationCenter
        signals={signals}
        activeFilter={activeFilter}
        onViewCategory={
          onViewCategory
        }
      />

      <SoundManager
        signals={signals}
        activeFilter={activeFilter}
      />

      <section className="overflow-hidden rounded-xl border border-red-900/60 bg-zinc-950 shadow-[0_0_20px_rgba(239,68,68,0.12)]">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]" />

            <h2 className="text-xl font-bold uppercase tracking-wide text-white">
              Live Scanner
            </h2>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>
              Auto Refresh: 5s
            </span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M20 6v5h-5" />
              <path d="M4 18v-5h5" />
              <path d="M18.5 9a7 7 0 0 0-11.8-3L4 9" />
              <path d="M5.5 15a7 7 0 0 0 11.8 3L20 15" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse">
            <thead className="bg-zinc-900 text-sm uppercase tracking-wide text-gray-300">
              <tr>
                <th className="w-[240px] border-b border-r border-zinc-800 px-5 py-4 text-left">
                  Pair
                </th>

                <th className="w-[170px] border-b border-r border-zinc-800 px-5 py-4 text-center">
                  Signal
                </th>

                <th className="border-b border-r border-zinc-800 px-5 py-4 text-center">
                  Entry
                </th>

                <th className="border-b border-r border-zinc-800 px-5 py-4 text-center">
                  Take Profit
                </th>

                <th className="border-b border-r border-zinc-800 px-5 py-4 text-center">
                  Stop Loss
                </th>

                <th className="w-[130px] border-b border-zinc-800 px-5 py-4 text-center">
                  Age
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSignals.length >
              0 ? (
                filteredSignals.map(
                  (signal) => (
                    <SignalRow
                      key={signal.id}
                      signal={signal}
                      now={now}
                    />
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    {getEmptyMessage()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}