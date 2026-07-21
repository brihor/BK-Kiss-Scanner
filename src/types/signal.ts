export type SignalDirection = "BUY" | "SELL";

export interface Signal {
  id: string;
  pair: string;

  direction: SignalDirection;
  signal?: SignalDirection;

  entry: number;
  takeProfit: number | null;
  stopLoss: number | null;

  signalTime: string;
  lockedUntil: string;
  ageMinutes: number;

  rsi: number;
  stochasticK: number;
  upperBand: number;
  lowerBand: number;
  high: number;
  low: number;
}