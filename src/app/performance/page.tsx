"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./performance.css";

type PerformanceData = {
  totalAlerts: number;
  selectedDayAlerts: number;
  tp: number;
  sl: number;
  unresolved: number;
  completed: number;
  winRate: number;
  dailyAlerts: { day: string; alerts: number }[];
};

export default function PerformancePage() {
  const [days, setDays] = useState(1);
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    const loadPerformance = () => {
      fetch(`/api/performance?days=${days}&filter=${encodeURIComponent(filter)}`)
        .then((res) => res.json())
        .then(setData);
    };

    loadPerformance();

    const interval = setInterval(loadPerformance, 15000);

    return () => clearInterval(interval);
  }, [days, filter]);

  return (
    <main className="performance-page">
      <div className="performance-container">
        <div className="performance-top">
          <Link href={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("app") === "1" ? "/app-scanner" : "/dashboard"} className="back-link back-link-highlight">
            ↩ Back to Scanner
          </Link>

          <select
            className="instrument-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Instruments</option>
            <option value="forex">Forex</option>
            <option value="metals">Metals</option>
            <option value="indices">Indices</option>
            <optgroup label="Forex Pairs">
              {[
                "EUR_USD","GBP_USD","AUD_USD","NZD_USD","USD_JPY","USD_CAD","USD_CHF",
                "EUR_GBP","EUR_JPY","EUR_AUD","EUR_NZD","EUR_CAD","EUR_CHF",
                "GBP_JPY","GBP_AUD","GBP_NZD","GBP_CAD","GBP_CHF",
                "AUD_JPY","AUD_NZD","AUD_CAD","AUD_CHF",
                "NZD_JPY","NZD_CAD","NZD_CHF","CAD_JPY","CAD_CHF"
              ].map((pair) => (
                <option key={pair} value={pair}>{pair.replace("_", "/")}</option>
              ))}
            </optgroup>
            <optgroup label="Metals">
              <option value="XAU_USD">Gold (XAU/USD)</option>
              <option value="XAG_USD">Silver (XAG/USD)</option>
            </optgroup>
            <optgroup label="Indices">
              <option value="NAS100_USD">NAS100</option>
              <option value="US30_USD">US30</option>
            </optgroup>
          </select>
        </div>

        <h1>Scanner Activity</h1>
        <p className="performance-subtitle">
          See how actively the KiSS Scanner is identifying market alignments.
        </p>

        <div className="day-filter">
          {[1, 2, 3, 4, 5, 6].map((day) => (
            <button
              key={day}
              className={days === day ? "active" : ""}
              onClick={() => setDays(day)}
            >
              Day {day}
            </button>
          ))}
        </div>

        <p className="trading-days-note">
          Trading Day Periods • Based on New York Time (ET)
        </p>

        <section className="performance-summary activity-summary">
          <div className="activity-total-card">
            <span className="activity-label">TOTAL ALERTS</span>
            <strong>{data?.totalAlerts ?? 0}</strong>
            <p>Collective alerts throughout the week</p>
            <div className="selected-day-alerts">
              <span>DAY {days} ACTIVITY</span>
              <strong>{data?.selectedDayAlerts ?? 0} ALERTS</strong>
            </div>
          </div>
        </section>

        <section className="asset-section">
          <h2>Scanner Coverage</h2>

          <div className="asset-grid">
            <div className="asset-card">
              <h3>💱 Forex</h3>
              <span>KiSS Scanner monitoring active</span>
            </div>

            <div className="asset-card">
              <h3>🥇 Metals</h3>
              <span>KiSS Scanner monitoring active</span>
            </div>

            <div className="asset-card">
              <h3>📈 Indices</h3>
              <span>KiSS Scanner monitoring active</span>
            </div>
          </div>
        </section>

        <section className="daily-section">
          <h2>Alerts by Day</h2>
          <div className="daily-grid">
            {[1, 2, 3, 4, 5, 6].map((day) => {
              const label = `Day ${day}`;
              const alerts =
                data?.dailyAlerts?.find((item) => item.day === label)?.alerts ?? 0;

              return (
                <div className="daily-card" key={day}>
                  <strong>{label}</strong>
                  <span>{alerts} alert{alerts === 1 ? "" : "s"}</span>
                </div>
              );
            })}
            <div className="daily-card">
              <strong>Saturday</strong>
              <span>Market Closed • Weekly Reset</span>
            </div>
          </div>
        </section>

        <p className="performance-disclaimer">
          KiSS Scanner alerts identify indicator alignment and are not trade
          recommendations. Always consider market conditions, higher-timeframe
          structure, additional confluences, and proper risk management before
          making trading decisions.
        </p>
      </div>
    </main>
  );
}
