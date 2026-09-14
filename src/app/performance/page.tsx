"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./performance.css";

type PerformanceData = {
  totalAlerts: number;
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

  const winRate = data?.winRate ?? 0;

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

        <h1>Scanner Performance</h1>
        <p className="performance-subtitle">
          Performance of completed KiSS Scanner alerts.
        </p>

        <div className="day-filter">
          {[1, 2, 3, 4, 5].map((day) => (
            <button
              key={day}
              className={days === day ? "active" : ""}
              onClick={() => setDays(day)}
            >
              {day} Day{day > 1 ? "s" : ""}
            </button>
          ))}
        </div>

        <p className="trading-days-note">
          Trading days only • Sunday session included • Results are combined for the selected period
        </p>

        <section className="performance-summary">
          <div
            className="performance-circle"
            style={{
              background:
                  data?.completed && data.completed > 0
                    ? `conic-gradient(#2ecc71 0% ${winRate}%, #ff4d4d ${winRate}% 100%)`
                    : "#292929",
            }}
          >
            <div className="performance-circle-inner">
              <span>{winRate}%</span>
              <small>TP Hit Rate</small>
            </div>
          </div>

          <div className="performance-stats">
            <div className="stat-card tp">
              <span>Take Profit Hits</span>
              <strong>{data?.tp ?? 0}</strong>
            </div>

            <div className="stat-card sl">
              <span>Stop Loss Hits</span>
              <strong>{data?.sl ?? 0}</strong>
            </div>

            <div className="stat-card">
              <span>Total Alerts</span>
              <strong>{data?.totalAlerts ?? 0}</strong>
            </div>
          </div>
        </section>

        <section className="asset-section">
          <h2>Performance by Asset Class</h2>

          <div className="asset-grid">
            <div className="asset-card">
              <h3>💱 Forex</h3>
              <span>Performance tracking active</span>
            </div>

            <div className="asset-card">
              <h3>🥇 Metals</h3>
              <span>Performance tracking active</span>
            </div>

            <div className="asset-card">
              <h3>📈 Indices</h3>
              <span>Performance tracking active</span>
            </div>
          </div>
        </section>

        <section className="daily-section">
          <h2>Alerts by Day</h2>
          <div className="daily-grid">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
              const alerts =
                data?.dailyAlerts?.find((item) => item.day === day)?.alerts ?? 0;

              return (
                <div className="daily-card" key={day}>
                  <strong>{day}</strong>
                  <span>
                    {day === "Saturday"
                      ? "Market Closed"
                      : `${alerts} alert${alerts === 1 ? "" : "s"}`}
                  </span>
                </div>
              );
            })}
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
