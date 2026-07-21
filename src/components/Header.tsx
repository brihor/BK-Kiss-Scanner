"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Header() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("bk-sound-enabled");

    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }
  }, []);

  function toggleSound() {
    const newValue = !soundEnabled;

    setSoundEnabled(newValue);

    localStorage.setItem(
      "bk-sound-enabled",
      String(newValue)
    );
  }

  return (
    <header className="bk-header">
      <div className="bk-brand">
        <Image
          src="/images/BKLogo.png"
          alt="BK Trading Academy"
          width={190}
          height={190}
          className="bk-logo"
          priority
        />

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