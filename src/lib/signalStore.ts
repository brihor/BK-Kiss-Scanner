import type { Signal } from "@/types/signal";

const globalSignalStore = globalThis as typeof globalThis & {
  bkKissSignals?: Signal[];
};

const signals =
  globalSignalStore.bkKissSignals ??
  (globalSignalStore.bkKissSignals = []);

export function getSignals(): Signal[] {
  return signals;
}

export function findSignal(pair: string): Signal | undefined {
  return signals.find((signal) => signal.pair === pair);
}

export function addSignal(signal: Signal): void {
  signals.unshift(signal);
}

export function updateSignal(updatedSignal: Signal): void {
  const index = signals.findIndex(
    (signal) => signal.pair === updatedSignal.pair
  );

  if (index !== -1) {
    signals[index] = updatedSignal;
  }
}

export function removeSignal(pair: string): void {
  const index = signals.findIndex(
    (signal) => signal.pair === pair
  );

  if (index !== -1) {
    signals.splice(index, 1);
  }
}