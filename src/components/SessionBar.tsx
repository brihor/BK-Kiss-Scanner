"use client";

import { useEffect, useState } from "react";

type Session = {
  city: string;
  flag: string;
  timeZone: string;
  openHour: number;
  closeHour: number;
};

const sessions: Session[] = [
  {
    city: "London",
    flag: "🇬🇧",
    timeZone: "Europe/London",
    openHour: 8,
    closeHour: 17,
  },
  {
    city: "New York",
    flag: "🇺🇸",
    timeZone: "America/New_York",
    openHour: 8,
    closeHour: 17,
  },
  {
    city: "Tokyo",
    flag: "🇯🇵",
    timeZone: "Asia/Tokyo",
    openHour: 9,
    closeHour: 18,
  },
  {
    city: "Sydney",
    flag: "🇦🇺",
    timeZone: "Australia/Sydney",
    openHour: 8,
    closeHour: 17,
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

  return (
    <section className="session-grid">
      {sessions.map((session) => {
        const formatter = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: session.timeZone,
        });

        const hourFormatter = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: session.timeZone,
        });

        const localTime = formatter.format(now);
        const currentHour = Number(hourFormatter.format(now));

        const isOpen =
          currentHour >= session.openHour &&
          currentHour < session.closeHour;

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