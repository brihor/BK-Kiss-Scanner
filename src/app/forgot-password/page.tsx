"use client";

import { useState } from "react";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to send reset email.");
      } else {
        setMessage(
          "If an account exists for that email, we've sent a password reset link."
        );
        setEmail("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bk-login-page">
      <div className="bk-login-card">

        <div className="bk-login-brand">
          <span>BK</span> KiSS SCANNER
        </div>

        <h1>Forgot Password?</h1>

        <p className="bk-login-subtitle">
          Enter your email below and we'll send you a secure link to reset your password.
        </p>

        <form onSubmit={handleSubmit}>

          <label>
            Email
            <input
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {message && (
            <div className="bk-login-success">
              {message}
            </div>
          )}

          {error && (
            <div className="bk-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </button>

        </form>

      </div>
    </main>
  );
}