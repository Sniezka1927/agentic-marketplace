"use client";

import { useEffect, useId, useState } from "react";
import { BotEngine, type BotFrame } from "@/vendor/bloub/engine";
import { EXPRESSIONS } from "@/vendor/bloub/expressions";
import { DEMI_VIEWBOX, RAYON } from "@/vendor/bloub/repere";
import { COLORS, SHAPES } from "@/vendor/bloub/skins";

const HIDDEN_ON_BACKGROUND = new Set(["encre", "creme", "gris"]);
const PALETTE = COLORS.filter((color) => !HIDDEN_ON_BACKGROUND.has(color.id));
const REST_FRAME_AT = 1.2;

const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const botLook = (botId: string) => {
  const seed = hash(botId);
  return {
    color: PALETTE[seed % PALETTE.length]!.hex,
    shape: SHAPES[(seed >>> 8) % SHAPES.length]!,
    expression: EXPRESSIONS[(seed >>> 16) % EXPRESSIONS.length]!,
  };
};

const createEngine = (botId: string) => {
  const look = botLook(botId);
  return { look, engine: new BotEngine(RAYON, "idle", look.shape.radii, look.expression) };
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function BotAvatar({
  botId,
  size = 40,
  animated = false,
  blobs = false,
}: {
  botId: string;
  size?: number;
  animated?: boolean;
  blobs?: boolean;
}) {
  const maskId = `bot-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [{ look, engine }] = useState(() => createEngine(botId));
  const [frame, setFrame] = useState<BotFrame>(() => engine.sample(REST_FRAME_AT));

  useEffect(() => {
    if (!animated || prefersReducedMotion()) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setFrame(engine.sample(REST_FRAME_AT + (now - start) / 1000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animated, engine]);

  const vb = DEMI_VIEWBOX;
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox={`${-vb} ${-vb} ${vb * 2} ${vb * 2}`}
      role="img"
      aria-label="Bot avatar"
      className="relative shrink-0"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-vb} y={-vb} width={vb * 2} height={vb * 2}>
          <path d={frame.bodyPath} fill="#fff" />
          {frame.eyes.map((eye, i) => (
            <path key={i} d={eye.d} transform={eye.matrix} opacity={eye.alpha} fill="#000" />
          ))}
        </mask>
      </defs>
      <g opacity={frame.bodyAlpha}>
        <path d={frame.bodyPath} style={{ fill: "var(--background)" }} />
        <g mask={`url(#${maskId})`}>
          <rect x={-vb} y={-vb} width={vb * 2} height={vb * 2} fill={look.color} />
        </g>
      </g>
    </svg>
  );

  if (!blobs) return svg;

  const blob = (opacity: number) => `color-mix(in srgb, ${look.color} ${opacity}%, transparent)`;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size * 1.4, height: size * 1.4 }}>
      <span
        aria-hidden
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle at 25% 30%, ${blob(35)}, transparent 55%), radial-gradient(circle at 75% 25%, ${blob(25)}, transparent 50%), radial-gradient(circle at 30% 80%, ${blob(30)}, transparent 50%), radial-gradient(circle at 75% 75%, ${blob(45)}, transparent 55%)`,
        }}
      />
      {svg}
    </span>
  );
}
