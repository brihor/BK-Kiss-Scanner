"use client";

"use client";

import { useRouter } from "next/navigation";
import "./account.css";

export default function AccountPage() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  async function manageSubscription() {
    try {
      const response = await fetch(
        "/api/stripe/create-portal-session",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to open billing portal.");
        return;
      }

      window.location.href = data.url;
    } catch {
      alert("Unable to connect to Stripe.");
    }
  }

  return (
    <main className="account-page">
      <div className="account-card">

        <div className="account-brand">
          <span>BK</span> KiSS SCANNER
        </div>

        <h1>Welcome to Your Scanner</h1>

        <p className="account-subtitle">
          Your BK KiSS Scanner access is ready.
        </p>

        <div className="status-box">

          <span className="status-label">
            SUBSCRIPTION
          </span>

          <div className="status-active">
            <span className="status-dot"></span>
            Active
          </div>

        </div>

        <button
          className="scanner-button"
          onClick={() => router.push("/")}
        >
          OPEN KiSS SCANNER
        </button>

        <div className="account-options">

          <button
            className="option-button"
            onClick={manageSubscription}
          >
            Manage Subscription
          </button>

          <button
            className="option-button"
            onClick={logout}
          >
            Log Out
          </button>

        </div>

        <div className="download-section">

          <span className="download-title">
            Download the KiSS Scanner Mobile App
          </span>

          <div className="store-buttons">

            <a
              href="#"
              className="store-link"
            >
              <img
                src="/images/app-store-badge.svg"
                className="store-badge"
                alt="Download on the App Store"
              />
            </a>

            <a
              href="#"
              className="store-link"
            >
              <div className="google-placeholder">

                <div className="play-icon"></div>

                <div>
                  <small>GET IT ON</small>
                  <strong>Google Play</strong>
                </div>

              </div>

            </a>

          </div>

        </div>

        <p className="app-note">
          Use your same BK KiSS Scanner login on the web,
          iPhone, iPad, or Android.
        </p>

      </div>
    </main>
  );
}