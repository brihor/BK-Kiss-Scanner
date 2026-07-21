import { Signal } from "../types/signal";

export const mockSignals: Signal[] = [
  {
    id: "1",
    pair: "EURUSD",
    direction: "BUY",
    entry: 1.17345,
    takeProfit: 1.17545,
    stopLoss: 1.17145,
    session: "London",
    signalTime: new Date(),
    lockedUntil: new Date(),
    ageMinutes: 2,
    strength: 5,
  },

  {
    id: "2",
    pair: "GBPUSD",
    direction: "SELL",
    entry: 1.35418,
    takeProfit: 1.35218,
    stopLoss: 1.35618,
    session: "New York",
    signalTime: new Date(),
    lockedUntil: new Date(),
    ageMinutes: 5,
    strength: 4,
  },

  {
    id: "3",
    pair: "USDJPY",
    direction: "BUY",
    entry: 148.215,
    takeProfit: 148.415,
    stopLoss: 148.015,
    session: "Tokyo",
    signalTime: new Date(),
    lockedUntil: new Date(),
    ageMinutes: 1,
    strength: 5,
  },
];