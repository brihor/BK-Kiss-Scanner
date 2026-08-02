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

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
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
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url('/images/bk-scanner-welcome.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "40px 7%",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "470px",
          background: "rgba(8, 13, 20, 0.91)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "18px",
          padding: "36px",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.65), 0 0 35px rgba(160,0,0,0.18)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            width: "55px",
            height: "4px",
            background: "#b21f24",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        />

        <h1
          style={{
            fontSize: "30px",
            margin: "0 0 8px",
            lineHeight: "1.2",
          }}
        >
          Welcome to BK KiSS Scanner
        </h1>

        <p
          style={{
            color: "#b7bec7",
            marginBottom: "28px",
            lineHeight: "1.5",
          }}
        >
          Your subscription is active. Create your password to access
          your scanner.
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
              background: "rgba(4, 9, 14, 0.88)",
              color: "#ffffff",
              boxSizing: "border-box",
              fontSize: "16px",
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
              background: "rgba(4, 9, 14, 0.88)",
              color: "#ffffff",
              boxSizing: "border-box",
              fontSize: "16px",
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
              background: "rgba(4, 9, 14, 0.88)",
              color: "#ffffff",
              boxSizing: "border-box",
              fontSize: "16px",
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
              background:
                "linear-gradient(135deg, #8C1D1D 0%, #c52626 100%)",
              color: "#ffffff",
              border: "1px solid rgba(255,80,80,0.4)",
              borderRadius: "8px",
              fontSize: "17px",
              fontWeight: "700",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: "0 8px 25px rgba(180,0,0,0.25)",
            }}
          >
            {loading ? "Creating Account..." : "Create Password"}
          </button>
        </form>

        <p
          style={{
            color: "#737d88",
            fontSize: "12px",
            textAlign: "center",
            margin: "20px 0 0",
          }}
        >
          BK Trading Academy • BK KiSS Scanner
        </p>
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