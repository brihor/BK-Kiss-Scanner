"use client";

import { Signal } from "@/types/signal";

type Props = {
  signal: Signal;
  now: number;
};

function cleanPair(pair: string): string {
  return pair
    .replace(/^OANDA:/i, "")
    .replace(/[_/\-\s]/g, "")
    .toUpperCase();
}

function formatPair(pair: string): string {
  const cleanedPair = cleanPair(pair);

  if (cleanedPair.length === 6) {
    return `${cleanedPair.slice(0, 3)}/${cleanedPair.slice(3, 6)}`;
  }

  if (cleanedPair === "NAS100USD") {
    return "NAS100";
  }

  if (cleanedPair === "US30USD") {
    return "US30";
  }

  if (cleanedPair === "SPX500USD") {
    return "SPX500";
  }

  return cleanedPair;
}

function formatPrice(
  value: unknown,
  pair?: string
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  const cleanedPair = pair
    ? cleanPair(pair)
    : "";

  let decimals = 5;

  // JPY Forex Pairs
  if (cleanedPair.includes("JPY")) {
    decimals = 3;
  }

  // Gold, Silver, Indices
  if (
    cleanedPair.startsWith("XAU") ||
    cleanedPair.startsWith("XAG") ||
    cleanedPair.startsWith("NAS100") ||
    cleanedPair.startsWith("US30") ||
    cleanedPair.startsWith("SPX500")
  ) {
    decimals = 2;
  }

  return numberValue.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  );
}

export default function SignalRow({ signal, now }: Props) {
  const signalTimestamp = new Date(signal.signalTime).getTime();

  const ageMinutes = Number.isNaN(signalTimestamp)
    ? 0
    : Math.max(0, Math.floor((now - signalTimestamp) / 60000));

  const isBuy = signal.direction === "BUY";

  return (
    <tr className="border-t border-zinc-800 transition-colors hover:bg-zinc-800/40">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold text-gray-300">
            {cleanPair(signal.pair).slice(0, 2)}
          </div>

          <span className="font-semibold text-white">
            {formatPair(signal.pair)}
          </span>
        </div>
      </td>

      <td className="p-4">
        <span
          className={`inline-flex min-w-[82px] items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold text-white ${
            isBuy
              ? "border-green-400/50 bg-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
              : "border-red-400/50 bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
          }`}
        >
          <span aria-hidden="true">{isBuy ? "↑" : "↓"}</span>
          {signal.direction}
        </span>
      </td>

      <td className="p-4 font-mono text-gray-300">
        {formatPrice(signal.entry, signal.pair)}
      </td>

      <td className="p-4 font-mono text-green-400">
        {formatPrice(signal.takeProfit, signal.pair)}
      </td>

      <td className="p-4 font-mono text-red-400">
        {formatPrice(signal.stopLoss, signal.pair)}
      </td>

      <td className="p-4">
        <span className="inline-flex items-center gap-2 text-yellow-400">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>

          {ageMinutes}m
        </span>
      </td>
    </tr>
  );
}