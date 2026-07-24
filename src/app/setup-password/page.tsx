"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to complete account setup.");
        return;
      }

      setMessage(
        "Your password has been created successfully. You can now sign in to the BK KiSS Scanner app."
      );

      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to complete account setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#03070d",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#111820",
          border: "1px solid #29323d",
          borderRadius: "16px",
          padding: "36px",
        }}
      >
        <h1 style={{ fontSize: "30px", marginBottom: "8px" }}>
          Welcome to BK KiSS Scanner
        </h1>

        <p style={{ color: "#aab3bd", marginBottom: "28px" }}>
          Create your password to complete your account setup.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "18px",
              borderRadius: "8px",
              border: "1px solid #3a4652",
              background: "#0a1016",
              color: "#ffffff",
              boxSizing: "border-box",
            }}
          />

          <label style={{ display: "block", marginBottom: "8px" }}>
            Create Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "18px",
              borderRadius: "8px",
              border: "1px solid #3a4652",
              background: "#0a1016",
              color: "#ffffff",
              boxSizing: "border-box",
            }}
          />

          <label style={{ display: "block", marginBottom: "8px" }}>
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            required
            minLength={8}
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "22px",
              borderRadius: "8px",
              border: "1px solid #3a4652",
              background: "#0a1016",
              color: "#ffffff",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p style={{ color: "#ff6b6b", marginBottom: "18px" }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: "#7ee787", marginBottom: "18px" }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: "#8C1D1D",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "17px",
              fontWeight: "700",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Creating Account..." : "Create Password"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetupPasswordForm />
    </Suspense>
  );
}
