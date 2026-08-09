"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Header() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("bk-sound-enabled");

    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setFirstName(data.user?.firstName || "");
      } catch (error) {
        console.error("Unable to load scanner user:", error);
      }
    }

    loadUser();
  }, []);

  function toggleSound() {
    const newValue = !soundEnabled;

    setSoundEnabled(newValue);

    localStorage.setItem(
      "bk-sound-enabled",
      String(newValue)
    );

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "BK_SOUND_SETTING",
          enabled: newValue,
        })
      );
    }
  }

  return (
    <header className="bk-header">
      <div className="owners-container">
        <Image
          src="/images/owners-new.jpeg"
          alt="Kenya and Brian"
          width={170}
          height={170}
          className="owners"
          priority
        />
      </div>

      <div className="bk-title">
        <h1>BK KiSS Scanner 💋</h1>

        <p>
          Real Time Trading Opportunities Powered by KiSS
        </p>

        {firstName && (
          <div className="scanner-welcome">
            Welcome, {firstName}
          </div>
        )}
      </div>

      <div className="live-container">
        <button
          className="sound-toggle"
          onClick={toggleSound}
          title={
            soundEnabled
              ? "Turn Sound Off"
              : "Turn Sound On"
          }
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>

        <span className="live-dot"></span>
        <span>LIVE</span>
      </div>
    </header>
  );
}