"use client";

import { useEffect, useState } from "react";
import "./announcement-popup.css";

type Announcement = {
  id: string;
  title: string;
  message: string;
  buttonText: string | null;
  buttonUrl: string | null;
};

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] =
    useState<Announcement | null>(null);

  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    let active = true;
    let showTimer: number | null = null;

    const checkForAnnouncement = async () => {
      try {
        const response = await fetch("/api/announcements/current", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (!active || !data?.announcement) return;

        setAnnouncement((current) => {
          // Do nothing if this exact announcement is already displayed.
          if (current?.id === data.announcement.id) {
            return current;
          }

          if (showTimer) {
            window.clearTimeout(showTimer);
          }

          showTimer = window.setTimeout(() => {
            if (active) {
              setVisible(true);
            }
          }, 120);

          return data.announcement;
        });
      } catch {
        // Announcement checks must never interfere with the scanner.
      }
    };

    // Keep the exact current behavior:
    // check immediately whenever the scanner opens.
    checkForAnnouncement();

    // Added behavior:
    // while the scanner stays open, quietly check once per minute.
    const interval = window.setInterval(
      checkForAnnouncement,
      60 * 1000
    );

    return () => {
      active = false;
      window.clearInterval(interval);

      if (showTimer) {
        window.clearTimeout(showTimer);
      }
    };
  }, []);

  const dismiss = async () => {
    if (!announcement || dismissing) return;

    setDismissing(true);
    setVisible(false);

    try {
      await fetch("/api/announcements/dismiss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          announcementId: announcement.id,
        }),
      });

      window.setTimeout(() => {
        setAnnouncement(null);
        setDismissing(false);
      }, 250);
    } catch {
      setDismissing(false);
      setVisible(true);
    }
  };

  if (!announcement) return null;

  return (
    <div
      className={`bk-announcement-backdrop ${
        visible ? "bk-announcement-visible" : ""
      }`}
      role="presentation"
    >
      <section
        className="bk-announcement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-announcement-title"
      >
        <div className="bk-announcement-top-glow" />
        <div className="bk-announcement-side-glow bk-announcement-side-left" />
        <div className="bk-announcement-side-glow bk-announcement-side-right" />

        <div className="bk-announcement-mic-wrap" aria-hidden="true">
          <img
            src="/announcement-assets/announcement-mic.png"
            alt=""
            className="bk-announcement-mic"
          />
        </div>

        <button
          type="button"
          className="bk-announcement-close"
          onClick={dismiss}
          aria-label="Dismiss announcement"
        >
          ×
        </button>

        <div className="bk-announcement-brand">
          <div className="bk-announcement-icon-wrap">
            <div className="bk-announcement-icon-pulse" />
            <div className="bk-announcement-icon">📣</div>
          </div>

          <div>
            <div className="bk-announcement-brand-name">
              BK KiSS Scanner
            </div>
            <div className="bk-announcement-label">
              ANNOUNCEMENT
            </div>
          </div>
        </div>

        <div className="bk-announcement-divider" />

        <h2
          id="bk-announcement-title"
          className="bk-announcement-title"
        >
          {announcement.title}
        </h2>

        <div className="bk-announcement-message-box">
          <div
            className="bk-announcement-message"
            dangerouslySetInnerHTML={{ __html: announcement.message }}
          />
        </div>

        {announcement.buttonText && announcement.buttonUrl && (
          <a
            href={announcement.buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bk-announcement-link"
          >
            {announcement.buttonText} →
          </a>
        )}


      </section>
    </div>
  );
}
