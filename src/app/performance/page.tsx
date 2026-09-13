"use client";

import Link from "next/link";
import "./performance.css";

export default function PerformancePage() {
  return (
    <main className="performance-page">
      <div className="performance-container">
        <div className="performance-top">
          <Link href="/app-scanner" className="back-link">
            ← Back to Scanner
          </Link>

          <select className="instrument-select" defaultValue="all">
            <option value="all">All Instruments</option>
          </select>
        </div>

        <h1>Scanner Performance</h1>
        <p className="performance-subtitle">
          Performance of completed KiSS Scanner alerts.
        </p>

        <section className="performance-summary">
          <div className="performance-circle">
            <span>—</span>
            <small>Performance</small>
          </div>

          <div className="performance-stats">
            <div className="stat-card tp">
              <span>Take Profit Hits</span>
              <strong>—</strong>
            </div>

            <div className="stat-card sl">
              <span>Stop Loss Hits</span>
              <strong>—</strong>
            </div>

            <div className="stat-card neutral">
              <span>Breakeven / No Result</span>
              <strong>—</strong>
            </div>

            <div className="stat-card">
              <span>Total Completed Alerts</span>
              <strong>—</strong>
            </div>
          </div>
        </section>

        <section className="asset-section">
          <h2>Performance by Asset Class</h2>

          <div className="asset-grid">
            <div className="asset-card">
              <h3>Forex</h3>
              <span>—</span>
            </div>

            <div className="asset-card">
              <h3>Metals</h3>
              <span>—</span>
            </div>

            <div className="asset-card">
              <h3>Indices</h3>
              <span>—</span>
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
