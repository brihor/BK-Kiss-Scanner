"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to sign in.");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
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

        <h1>Welcome Back</h1>
        <p className="bk-login-subtitle">
          Sign in to access your BK KiSS Scanner.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="bk-login-error">{error}</div>}

          <button type="submit" disabled={loading}>
  {loading ? "SIGNING IN..." : "SIGN IN"}
</button>

<p
  className="bk-forgot-password"
  onClick={() => router.push("/forgot-password")}
>
  Forgot Password?
</p>

<p className="bk-login-help">
  An active BK KiSS Scanner subscription is required.
</p>
</form>
      </div>
    </main>
  );
}
