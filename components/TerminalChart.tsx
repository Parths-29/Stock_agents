"use client";
import { useState } from "react";
import { assets, money, type Symbol } from "@/lib/market";
import {
  frames,
  type Frame,
  type Quote,
  type ChartData,
} from "@/lib/market-data";
export default function TerminalChart({
  symbol,
  quote,
  chart,
  frame,
  onFrame,
}: {
  symbol: Symbol;
  quote: Quote;
  chart: ChartData | null;
  frame: Frame;
  onFrame: (frame: Frame) => void;
}) {
  const [hover, setHover] = useState<number | null>(null),
    a = assets.find((a) => a.symbol === symbol)!,
    candles =
      chart?.symbol === symbol && chart.frame === frame ? chart.candles : [],
    points = candles.map((c) => c.close),
    count = points.length;
  const min = count ? Math.min(...candles.map((c) => c.low)) * 0.999 : 0,
    max = count ? Math.max(...candles.map((c) => c.high)) * 1.001 : 1,
    y = (v: number) => 250 - ((v - min) / (max - min)) * 210,
    x = (i: number) => (i / Math.max(1, count - 1)) * 710,
    line = points.map((v, i) => `${x(i)},${y(v)}`).join(" "),
    volumeMax = Math.max(1, ...candles.map((c) => c.volume));
  const index = hover === null ? null : Math.min(hover, count - 1),
    selected = index === null ? null : candles[index],
    status = chart?.status || "unavailable";
  return (
    <section className="panel chart-panel">
      <div className="panel-title">
        <span>01 / MARKET OVERVIEW</span>
        <span className="muted">
          {status === "sample"
            ? "SAMPLE HISTORY"
            : status === "live"
              ? "COINBASE OHLCV"
              : status === "stale"
                ? "STALE HISTORY"
                : "WAITING FOR HISTORY"}
        </span>
      </div>
      <div className="chart-heading">
        <div className="asset-title">
          <span className="coin">{symbol === "ETH" ? "Ξ" : symbol[0]}</span>
          <div>
            <h2>
              {a.name} <span>{symbol} / USD</span>
            </h2>
            <small>
              {a.kind} · {quote.status.toUpperCase()}
            </small>
          </div>
        </div>
        <div className="price">
          <strong>
            {selected
              ? money(selected.close)
              : quote.price !== null
                ? money(quote.price)
                : "—"}
          </strong>
          <span className={(quote.change || 0) < 0 ? "negative" : "positive"}>
            {quote.change === null
              ? "—"
              : `${quote.change > 0 ? "+" : ""}${quote.change.toFixed(2)}%`}{" "}
            <small>/ 24H</small>
          </span>
        </div>
      </div>
      <div className="chart-toolbar">
        <div className="tabs">
          {frames.map((f) => (
            <button
              key={f}
              className={frame === f ? "active" : ""}
              onClick={() => {
                setHover(null);
                onFrame(f);
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="muted chart-label">PRICE + VOLUME</span>
      </div>
      {count > 1 ? (
        <div className="chart-wrap">
          <svg
            id="market-price-chart"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 320"
            role="img"
            aria-label={`${a.name} ${frame} ${chart?.source} price history`}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(
                Math.max(
                  0,
                  Math.min(
                    count - 1,
                    Math.round(
                      ((((e.clientX - r.left) / r.width) * 800) / 710) *
                        (count - 1),
                    ),
                  ),
                ),
              );
            }}
            onPointerLeave={() => setHover(null)}
          >
            <rect width="800" height="320" fill="#0D1B2A" />
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#FF6F61" stopOpacity=".22" />
                <stop offset="1" stopColor="#FF6F61" stopOpacity="0" />
              </linearGradient>
            </defs>
            <text x="0" y="14" fill="#9aa5ae" fontSize="8">
              {symbol}/USD · {frame} · {chart?.source} ·{" "}
              {chart?.asOf || "ILLUSTRATIVE SAMPLE"}
            </text>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <line
                  x1="0"
                  x2="715"
                  y1={32 + i * 55}
                  y2={32 + i * 55}
                  stroke="#F4F1DE"
                  opacity=".12"
                  strokeDasharray="3 6"
                />
                <text x="735" y={36 + i * 55} fill="#82909E" fontSize="10">
                  {(max - ((max - min) * i) / 4).toFixed(2)}
                </text>
              </g>
            ))}
            {candles.map((c, i) => (
              <rect
                key={c.time}
                x={x(i)}
                y={290 - (c.volume / volumeMax) * 30}
                width={Math.max(1, 600 / count)}
                height={(c.volume / volumeMax) * 30}
                fill="#FF6F61"
                opacity=".35"
              />
            ))}
            <polygon points={`0,260 ${line} 710,260`} fill="url(#area)" />
            <polyline
              points={line}
              stroke="#FF6F61"
              strokeWidth="2.5"
              strokeLinejoin="round"
              fill="none"
            />
            {index !== null && selected && (
              <g>
                <line
                  x1={x(index)}
                  x2={x(index)}
                  y1="20"
                  y2="290"
                  stroke="#F4F1DE"
                  opacity=".6"
                  strokeDasharray="3 4"
                />
                <circle
                  cx={x(index)}
                  cy={y(selected.close)}
                  r="5"
                  fill="#F4F1DE"
                  stroke="#FF6F61"
                  strokeWidth="3"
                />
              </g>
            )}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const c = candles[Math.round((i / 5) * (count - 1))];
              return (
                <text key={i} x={i * 137} y="315" fill="#82909E" fontSize="9">
                  {new Date(c.time * 1000)
                    .toISOString()
                    .slice(
                      frame === "1H" || frame === "24H" ? 11 : 5,
                      frame === "1H" || frame === "24H" ? 16 : 10,
                    )}
                </text>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="chart-unavailable">
          <b>No chart to inspect yet.</b>
          <span>{chart?.notice || "Loading market history…"}</span>
        </div>
      )}
      <div className="chart-bottom">
        <span>
          <i className="dot" />
          {chart?.source === "sample"
            ? "Illustrative sample history"
            : `${chart?.source || "Coinbase Exchange"} · ${chart?.asOf ? new Date(chart.asOf).toISOString().replace("T", " ").replace(".000Z", "") : "Awaiting provider"}`}
        </span>
        <span>UTC / USD</span>
      </div>
    </section>
  );
}
