"use client";

import { useEffect, useRef, useState } from "react";
import DashboardPage from "../dashboard/page";

const DESKTOP_WIDTH = 1700;

export default function AppScannerPage() {
  const contentRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    function updateLayout() {
      const newScale = Math.min(
        window.innerWidth / DESKTOP_WIDTH,
        1
      );

      setScale(newScale);

      if (contentRef.current) {
        setScaledHeight(
          contentRef.current.scrollHeight * newScale
        );
      }
    }

    updateLayout();

    const resizeObserver = new ResizeObserver(() => {
      updateLayout();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener("resize", updateLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height:
          scaledHeight !== undefined
            ? `${scaledHeight}px`
            : "100vh",
        overflowX: "hidden",
        background: "#03070d",
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: `${DESKTOP_WIDTH}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <DashboardPage />
      </div>
    </div>
  );
}