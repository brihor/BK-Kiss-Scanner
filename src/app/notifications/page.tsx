"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { instruments } from "@/lib/config/instruments";

function formatPair(pair: string) {
  return pair.replace("_", "/");
}

function getCategory(pair: string) {
  if (pair === "XAU_USD" || pair === "XAG_USD") return "METALS";
  if (pair === "NAS100_USD" || pair === "US30_USD") return "INDICES";
  return "FOREX";
}

export default function NotificationsPage() {
  const [disabled, setDisabled] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/push/preferences", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load preferences");
        return res.json();
      })
      .then((data) => {
        setDisabled(
          Array.isArray(data.disabledInstruments)
            ? data.disabledInstruments
            : []
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return {
      FOREX: instruments.filter((p) => getCategory(p) === "FOREX").sort(),
      METALS: instruments.filter((p) => getCategory(p) === "METALS").sort(),
      INDICES: instruments.filter((p) => getCategory(p) === "INDICES").sort(),
    };
  }, []);

  function toggle(pair: string) {
    setSaved(false);

    setDisabled((current) =>
      current.includes(pair)
        ? current.filter((p) => p !== pair)
        : [...current, pair]
    );
  }

  function selectCategory(pairs: string[]) {
    setSaved(false);
    setDisabled((current) =>
      current.filter((pair) => !pairs.includes(pair))
    );
  }

  function clearCategory(pairs: string[]) {
    setSaved(false);
    setDisabled((current) => [
      ...new Set([...current, ...pairs]),
    ]);
  }

  async function savePreferences() {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch("/api/push/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disabledInstruments: disabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save preferences");
      }

      setSaved(true);
    } catch (error) {
      console.error(error);
      alert("Unable to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] text-white p-6">
        Loading preferences...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white px-5 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("app") === "1" ? "/dashboard?app=1" : "/dashboard"}
              className="inline-flex items-center text-lg font-extrabold text-yellow-400 animate-pulse drop-shadow-[0_0_6px_rgba(250,204,21,0.8)] hover:text-yellow-300"
            >
              ↩ Back to Scanner
            </Link>

            <h1 className="mt-3 text-3xl font-bold">
              Scanner Preferences
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Choose which instruments you want to see in your scanner
              and receive push notifications for.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(grouped).map(([category, pairs]) => (
            <section
              key={category}
              className="rounded-2xl border border-zinc-800 bg-[#111] p-5"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{category}</h2>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => selectCategory(pairs)}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold hover:bg-zinc-800"
                  >
                    SELECT ALL
                  </button>

                  <button
                    type="button"
                    onClick={() => clearCategory(pairs)}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold hover:bg-zinc-800"
                  >
                    CLEAR
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {pairs.map((pair) => {
                  const enabled = !disabled.includes(pair);

                  return (
                    <button
                      key={pair}
                      type="button"
                      onClick={() => toggle(pair)}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        enabled
                          ? "border-red-500 bg-red-950/30 text-white"
                          : "border-zinc-800 bg-zinc-900 text-gray-500"
                      }`}
                    >
                      <div>{formatPair(pair)}</div>
                      <div className="mt-1 text-[10px]">
                        {enabled ? "✓ ON" : "OFF"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="sticky bottom-4 mt-8 flex justify-center">
          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="rounded-xl bg-red-600 px-8 py-4 font-bold text-white shadow-lg hover:bg-red-500 disabled:opacity-60"
          >
            {saving
              ? "SAVING..."
              : saved
              ? "✓ PREFERENCES SAVED"
              : "SAVE PREFERENCES"}
          </button>
        </div>
      </div>
    </main>
  );
}
