"use client";

import { useEffect, useState } from "react";

type Session = {
  city: string;
  flag: string;
  openHour: number;
  closeHour: number;
};

const sessions: Session[] = [
  {
    city: "London",
    flag: "🇬🇧",
    openHour: 3,
    closeHour: 12,
  },
  {
    city: "New York",
    flag: "🇺🇸",
    openHour: 8,
    closeHour: 17,
  },
  {
    city: "Tokyo",
    flag: "🇯🇵",
    openHour: 18,
    closeHour: 3,
  },
  {
    city: "Sydney",
    flag: "🇦🇺",
    openHour: 16,
    closeHour: 1,
  },
];

export default function SessionBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const nyParts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    hour12: false,
    timeZone: "America/New_York",
  }).formatToParts(now);

  const nyDay =
    nyParts.find((part) => part.type === "weekday")?.value ?? "";

  const nyHour = Number(
    nyParts.find((part) => part.type === "hour")?.value ?? "0"
  );

  return (
    <section className="session-grid">
      {sessions.map((session) => {
        const crossesMidnight =
          session.closeHour < session.openHour;

        const withinHours = crossesMidnight
          ? nyHour >= session.openHour ||
            nyHour < session.closeHour
          : nyHour >= session.openHour &&
            nyHour < session.closeHour;

        const weekendClosed =
          nyDay === "Sat" ||
          (nyDay === "Sun" && nyHour < 16);

        const fridayAfterClose =
          nyDay === "Fri" && nyHour >= 17;

        const isOpen =
          withinHours &&
          !weekendClosed &&
          !fridayAfterClose;

        const localTime = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone:
            session.city === "London"
              ? "Europe/London"
              : session.city === "New York"
              ? "America/New_York"
              : session.city === "Tokyo"
              ? "Asia/Tokyo"
              : "Australia/Sydney",
        }).format(now);

        return (
          <div
            key={session.city}
            className={`session-card transition-all duration-500 ${
              isOpen ? "session-open" : "session-closed"
            }`}
          >
            <div className="session-heading">
              <span className="session-flag">
                {session.flag}
              </span>

              <span>{session.city}</span>
            </div>

            <div
              className={`session-status ${
                isOpen ? "open pulse" : "closed"
              }`}
            >
              {isOpen ? "OPEN" : "CLOSED"}
            </div>

            <div className="session-time">
              {localTime}
            </div>
          </div>
        );
      })}
    </section>
  );
}