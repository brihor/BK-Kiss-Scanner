"use client";

import { useEffect, useState } from "react";

interface Signal {
  signal: "BUY" | "SELL";
}

export default function StatsBar() {
  const [activeSignals, setActiveSignals] = useState<Signal[]>([]);

  async function loadStats() {
    try {
      const response = await fetch("/api/signals", {
        cache: "no-store",
      });

      const data = await response.json();
      const signals = Array.isArray(data) ? data : data.signals ?? [];

      setActiveSignals(signals);
    } catch {
      setActiveSignals([]);
    }
  }

  useEffect(() => {
    loadStats();

    const interval = setInterval(loadStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const buySignals = activeSignals.filter(
    (signal) => signal.signal === "BUY"
  ).length;

  const sellSignals = activeSignals.filter(
    (signal) => signal.signal === "SELL"
  ).length;

  const stats = [
    {
      label: "Markets Scanned",
      value: "31",
      icon: "📊",
      className: "markets",
    },
    {
      label: "BUY Signals",
      value: buySignals.toString(),
      icon: "↗",
      className: "buy",
    },
    {
      label: "SELL Signals",
      value: sellSignals.toString(),
      icon: "↘",
      className: "sell",
    },
    {
      label: "Active",
      value: activeSignals.length.toString(),
      icon: "●",
      className:
        activeSignals.length > 0
          ? "active-on"
          : "active-off",
   },
    {
      label: "Server",
      value: "ONLINE",
      icon: "☁",
      className: "server",
    },
  ];

  return (
    <section className="stats-grid">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`stat-card ${stat.className}`}
        >
          <div className="stat-icon">{stat.icon}</div>

          <div>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}