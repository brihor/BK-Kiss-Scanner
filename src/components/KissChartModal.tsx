"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  LineSeries,
  LineStyle,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Signal } from "@/types/signal";
import {
  calculateChartIndicators,
  type ChartCandle,
} from "@/lib/chartIndicators";
import "./kiss-chart-modal.css";

type Props = {
  signal: Signal;
  onClose: () => void;
};

function cleanInstrument(pair: string) {
  const clean = pair
    .replace(/^OANDA:/i, "")
    .replace(/[\/\-\s]/g, "_")
    .toUpperCase();

  if (clean.includes("_")) return clean;

  if (clean === "NAS100USD") return "NAS100_USD";
  if (clean === "US30USD") return "US30_USD";
  if (clean === "XAUUSD") return "XAU_USD";
  if (clean === "XAGUSD") return "XAG_USD";

  if (clean.length === 6) {
    return `${clean.slice(0, 3)}_${clean.slice(3)}`;
  }

  return clean;
}

function displayPair(pair: string) {
  return cleanInstrument(pair).replace("_", "/");
}

export default function KissChartModal({
  signal,
  onClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const triggerLineRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function loadChart() {
      if (!containerRef.current) return;

      try {
        setLoading(true);
        setError("");

        const instrument = cleanInstrument(signal.pair);

        const response = await fetch(
          `/api/candles?instrument=${encodeURIComponent(instrument)}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Unable to load chart."
          );
        }

        if (cancelled) return;

        const candles: ChartCandle[] = result.candles;
        const indicators =
          calculateChartIndicators(candles);

        if (!candles.length) {
          throw new Error("No candle data available.");
        }

        const chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,

          layout: {
            background: {
              type: ColorType.Solid,
              color: "#090909",
            },
            textColor: "#d4d4d8",
            panes: {
              separatorColor: "#3f3f46",
              separatorHoverColor: "#71717a",
              enableResize: true,
            },
          },

          grid: {
            vertLines: { color: "#18181b" },
            horzLines: { color: "#18181b" },
          },

          crosshair: {
            vertLine: {
              color: "#71717a",
              style: LineStyle.Dashed,
            },
            horzLine: {
              color: "#71717a",
              style: LineStyle.Dashed,
            },
          },

          rightPriceScale: {
            borderColor: "#27272a",
            scaleMargins: {
              top: 0.03,
              bottom: 0.03,
     },
          },

          timeScale: {
            borderColor: "#27272a",
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 3,
            barSpacing: 16,
            minBarSpacing: 5,
          },
        });

        chartRef.current = chart;

        // PRICE + BOLLINGER BANDS
        const candleSeries = chart.addSeries(
          CandlestickSeries,
          {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
          },
          0
        );

        const upperSeries = chart.addSeries(
          LineSeries,
          {
            color: "#ef4444",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          0
        );

        const middleSeries = chart.addSeries(
          LineSeries,
          {
            color: "#e4e4e7",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          0
        );

        const lowerSeries = chart.addSeries(
          LineSeries,
          {
            color: "#ef4444",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          0
        );

        // RSI 7
        const rsiSeries = chart.addSeries(
          LineSeries,
          {
            color: "#ef4444",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            autoscaleInfoProvider: () => ({
              priceRange: {
                minValue: 0,
                maxValue: 100,
              },
            }),
          },
          1
        );

        rsiSeries.createPriceLine({
          price: 80,
          color: "#71717a",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "80",
        });

        rsiSeries.createPriceLine({
          price: 20,
          color: "#71717a",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "20",
        });

        // STOCHASTIC 5,3,3
        const stochKSeries = chart.addSeries(
          LineSeries,
          {
            color: "#f4f4f5",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            autoscaleInfoProvider: () => ({
              priceRange: {
                minValue: 0,
                maxValue: 100,
              },
            }),
          },
          2
        );

        const stochDSeries = chart.addSeries(
          LineSeries,
          {
            color: "#ef4444",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          2
        );

        stochKSeries.createPriceLine({
          price: 80,
          color: "#71717a",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "80",
        });

        stochKSeries.createPriceLine({
          price: 20,
          color: "#71717a",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "20",
        });

        // MACD - VISUAL ONLY
        // This does NOT participate in KiSS signal calculations.
        const macdSeries = chart.addSeries(
          LineSeries,
          {
            color: "#f4f4f5",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          3
        );

        const macdSignalSeries = chart.addSeries(
          LineSeries,
          {
            color: "#ef4444",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          3
        );

        macdSeries.createPriceLine({
          price: 0,
          color: "#52525b",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "0",
        });

        const candleData = candles.map((candle) => ({
          time: Math.floor(
            new Date(candle.time).getTime() / 1000
          ) as UTCTimestamp,
          open: Number(candle.mid.o),
          high: Number(candle.mid.h),
          low: Number(candle.mid.l),
          close: Number(candle.mid.c),
        }));

        candleSeries.setData(candleData);

        upperSeries.setData(
          indicators
            .filter((point) => point.upperBand !== null)
            .map((point) => ({
              time: point.time as UTCTimestamp,
              value: point.upperBand!,
            }))
        );

        middleSeries.setData(
          indicators
            .filter((point) => point.middleBand !== null)
            .map((point) => ({
              time: point.time as UTCTimestamp,
              value: point.middleBand!,
            }))
        );

        lowerSeries.setData(
          indicators
            .filter((point) => point.lowerBand !== null)
            .map((point) => ({
              time: point.time as UTCTimestamp,
              value: point.lowerBand!,
            }))
        );

        rsiSeries.setData(
          indicators
            .filter((point) => point.rsi !== null)
            .map((point) => ({
              time: point.time as UTCTimestamp,
              value: point.rsi!,
            }))
        );

        stochKSeries.setData(
          indicators
            .filter(
              (point) => point.stochasticK !== null
            )
            .map((point) => ({
              time: point.time as UTCTimestamp,
              value: point.stochasticK!,
            }))
        );

        stochDSeries.setData(
          indicators
            .filter(
              (point) => point.stochasticD !== null
            )
            .map((point) => ({
              time: point.time as UTCTimestamp,
              value: point.stochasticD!,
            }))
        );

        macdSeries.setData(
          indicators
            .filter((point) => point.macd !== null)
            .map((point) => ({
              time: point.time as UTCTimestamp,
              value: point.macd!,
            }))
        );

        macdSignalSeries.setData(
          indicators
            .filter(
              (point) => point.macdSignal !== null
            )
            .map((point) => ({
              time: point.time as UTCTimestamp,
              value: point.macdSignal!,
            }))
        );
                // Find the exact 15-minute candle containing the KiSS alert.
        const signalSeconds = Math.floor(
          new Date(signal.signalTime).getTime() / 1000
        );

        const signalBucket =
          Math.floor(signalSeconds / 900) * 900;

        let triggerCandle =
          candleData.find(
            (candle) =>
              Number(candle.time) === signalBucket
          ) ?? null;

        // Fallback to nearest candle if timestamps differ slightly.
        if (!triggerCandle) {
          triggerCandle = candleData.reduce(
            (closest, candle) => {
              const candleDistance = Math.abs(
                Number(candle.time) - signalSeconds
              );

              const closestDistance = Math.abs(
                Number(closest.time) - signalSeconds
              );

              return candleDistance < closestDistance
                ? candle
                : closest;
            },
            candleData[0]
          );
        }

        if (triggerCandle) {
          const markerColor =
            signal.direction === "BUY"
              ? "#22c55e"
              : "#ef4444";

          createSeriesMarkers(candleSeries, [
            {
              time: triggerCandle.time,
              position:
                signal.direction === "BUY"
                  ? "belowBar"
                  : "aboveBar",
              color: markerColor,
              shape:
                signal.direction === "BUY"
                  ? "arrowUp"
                  : "arrowDown",
              text: `${signal.direction} KiSS`,
            },
          ]);

          const triggerIndicator =
            indicators.find(
              (point) =>
                point.time ===
                Number(triggerCandle!.time)
            );

          if (triggerIndicator) {
            const bandValue =
              signal.direction === "BUY"
                ? triggerIndicator.lowerBand
                : triggerIndicator.upperBand;

            if (bandValue !== null) {
              createSeriesMarkers(
                signal.direction === "BUY"
                  ? lowerSeries
                  : upperSeries,
                [
                  {
                    time: triggerCandle.time,
                    position: "inBar",
                    color: markerColor,
                    shape: "circle",
                    text: "",
                  },
                ]
              );
            }

            if (triggerIndicator.rsi !== null) {
              createSeriesMarkers(rsiSeries, [
                {
                  time: triggerCandle.time,
                  position: "inBar",
                  color: markerColor,
                  shape: "circle",
                  text: "",
                },
              ]);
            }

            if (
              triggerIndicator.stochasticK !== null
            ) {
              createSeriesMarkers(stochKSeries, [
                {
                  time: triggerCandle.time,
                  position: "inBar",
                  color: markerColor,
                  shape: "circle",
                  text: "",
                },
              ]);
            }

            if (triggerIndicator.macd !== null) {
              createSeriesMarkers(macdSeries, [
                {
                  time: triggerCandle.time,
                  position: "inBar",
                  color: markerColor,
                  shape: "circle",
                  text: "",
                },
              ]);
            }
          }

          const triggerIndex = candleData.findIndex(
            (candle) =>
              candle.time === triggerCandle!.time
          );

          // Tighter default opening view.
          // Users can still pan/zoom through loaded candles locally.
          chart.timeScale().setVisibleLogicalRange({
            from: Math.max(0, triggerIndex - 20),
            to: triggerIndex + 20,
      });

          // Vertical alignment guide through all four panes.
          const updateTriggerLine = () => {
            if (!triggerLineRef.current) return;

            const coordinate =
              chart.timeScale().timeToCoordinate(
                triggerCandle!.time
              );

            if (coordinate === null) {
              triggerLineRef.current.style.display =
                "none";
              return;
            }

            triggerLineRef.current.style.display =
              "block";

            triggerLineRef.current.style.left =
              `${coordinate}px`;
          };

          requestAnimationFrame(updateTriggerLine);

          chart
            .timeScale()
            .subscribeVisibleLogicalRangeChange(
              updateTriggerLine
            );
        } else {
          chart.timeScale().fitContent();
        }

        // Give every indicator enough vertical room automatically.
        const setPaneHeights = () => {
          const panes = chart.panes();

          const totalHeight =
            containerRef.current?.clientHeight ?? 700;

          const priceHeight = Math.max(
            280,
            Math.floor(totalHeight * 0.48)
          );

          const indicatorHeight = Math.max(
            110,
            Math.floor(totalHeight * 0.173)
          );

          if (panes[0]) {
            panes[0].setHeight(priceHeight);
          }

          if (panes[1]) {
            panes[1].setHeight(indicatorHeight);
          }

          if (panes[2]) {
            panes[2].setHeight(indicatorHeight);
          }

          if (panes[3]) {
            panes[3].setHeight(indicatorHeight);
          }
        };

        requestAnimationFrame(setPaneHeights);

        resizeObserver = new ResizeObserver(() => {
          if (!containerRef.current) return;

          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });

          requestAnimationFrame(setPaneHeights);
        });

        resizeObserver.observe(
          containerRef.current
        );

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load chart."
          );

          setLoading(false);
        }
      }
    }

    loadChart();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [signal]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [onClose]);

  return (
    <div
      className="kiss-chart-backdrop"
      onMouseDown={onClose}
    >
      <section
        className="kiss-chart-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="kiss-chart-header">
          <div>
            <div className="kiss-chart-title">
              {displayPair(signal.pair)}
            </div>

            <div className="kiss-chart-subtitle">
              15 MIN • KiSS SETUP •{" "}
              <span
                className={
                  signal.direction === "BUY"
                    ? "kiss-buy"
                    : "kiss-sell"
                }
              >
                {signal.direction}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="kiss-chart-close"
            onClick={onClose}
            aria-label="Close chart"
          >
            ×
          </button>
        </header>

        <div className="kiss-chart-labels">
          

          <span>
            15 MINUTE KiSS CHART
          </span>
        </div>

        <div className="kiss-chart-body">
          {/* Indicator names */}
          <div className="kiss-pane-name kiss-pane-name-bb">
            BB 20,2
          </div>
          <div className="kiss-pane-name kiss-pane-name-rsi">
            RSI 7
          </div>

          <div className="kiss-pane-name kiss-pane-name-stoch">
            STOCH 5,3,3
          </div>

          <div className="kiss-pane-name kiss-pane-name-macd">
            MACD
            <span> VISUAL ONLY</span>
          </div>

          {loading && (
            <div className="kiss-chart-status">
              Loading chart…
            </div>
          )}

          {error && (
            <div className="kiss-chart-status kiss-chart-error">
              {error}
            </div>
          )}

          <div
            ref={containerRef}
            className={
              signal.direction === "BUY"
                ? "kiss-chart-container kiss-chart-buy"
                : "kiss-chart-container kiss-chart-sell"
            }
          />

          <div
            ref={triggerLineRef}
            className={
              signal.direction === "BUY"
                ? "kiss-trigger-line kiss-trigger-line-buy"
                : "kiss-trigger-line kiss-trigger-line-sell"
            }
            aria-hidden="true"
          />
        </div>
      </section>
    </div>
  );
}