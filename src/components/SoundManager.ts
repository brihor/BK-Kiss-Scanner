"use client";

import { useEffect, useRef } from "react";
import type { FilterType } from "@/app/dashboard/page";
import type { Signal } from "@/types/signal";

type Props = {
  signals: Signal[];
  activeFilter: FilterType;
};

type SignalCategory = Exclude<FilterType, "ALL">;

function cleanPair(pair: string): string {
  return pair
    .replace(/^OANDA:/i, "")
    .replace(/[_/\-\s]/g, "")
    .trim()
    .toUpperCase();
}

function getSignalCategory(
  pair: string
): SignalCategory {
  const cleanedPair = cleanPair(pair);

  if (
    cleanedPair === "NAS100" ||
    cleanedPair === "NAS100USD" ||
    cleanedPair === "US30" ||
    cleanedPair === "US30USD"
  ) {
    return "INDICES";
  }

  if (
    cleanedPair.startsWith("XAU") ||
    cleanedPair.startsWith("XAG")
  ) {
    return "METALS";
  }

  return "FOREX";
}

function playAudioFile(
  filePath: string,
  volume: number
) {
  const audio = new Audio(filePath);

  audio.volume = volume;
  audio.currentTime = 0;

  void audio.play().catch((error) => {
    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        return;
      }
    }

    console.error(
      `Unable to play sound: ${filePath}`,
      error
    );
  });
}

function playChaChing() {
  playAudioFile(
    "/sounds/cha-ching.mp3",
    0.7
  );
}

function playSwoosh() {
  playAudioFile(
    "/sounds/swoosh.mp3",
    0.7
  );
}

export default function SoundManager({
  signals,
  activeFilter,
}: Props) {
  const previousSignalIdsRef = useRef<
    Set<string>
  >(new Set());

  const hasInitializedRef = useRef(false);

  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    function unlockAudio() {
      audioUnlockedRef.current = true;

      window.removeEventListener(
        "pointerdown",
        unlockAudio
      );

      window.removeEventListener(
        "keydown",
        unlockAudio
      );
    }

    window.addEventListener(
      "pointerdown",
      unlockAudio
    );

    window.addEventListener(
      "keydown",
      unlockAudio
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        unlockAudio
      );

      window.removeEventListener(
        "keydown",
        unlockAudio
      );
    };
  }, []);

  useEffect(() => {

    const soundEnabled =
      localStorage.getItem("bk-sound-enabled") !== "false";

    if (!soundEnabled) {
      return;
 }
    const currentSignalIds = new Set(
      signals.map((signal) =>
        String(signal.id)
      )
    );

    if (!hasInitializedRef.current) {
      previousSignalIdsRef.current =
        currentSignalIds;

      hasInitializedRef.current = true;

      return;
    }

    const newSignals = signals.filter(
      (signal) =>
        !previousSignalIdsRef.current.has(
          String(signal.id)
        )
    );

    if (audioUnlockedRef.current) {
      newSignals.forEach((signal) => {
        const category =
          getSignalCategory(signal.pair);

        const signalIsVisible =
          activeFilter === "ALL" ||
          activeFilter === category;

        if (signalIsVisible) {
          playChaChing();
        } else {
          playSwoosh();
        }
      });
    }

    previousSignalIdsRef.current =
      currentSignalIds;
  }, [signals, activeFilter]);

  return null;
}