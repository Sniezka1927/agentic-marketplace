import { useId } from "react";

const ACCENTS = [
  "#1084FE",
  "#7C5CFF",
  "#F2557A",
  "#FF8A3D",
  "#16B67F",
  "#0FB5C9",
  "#E0B000",
  "#9B51E0",
];

const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const pick = (seed: number, shift: number, min: number, max: number) =>
  min + ((seed >>> shift) % (max - min + 1));

export const botAccent = (botId: string) => ACCENTS[hash(botId) % ACCENTS.length]!;

export function BotAvatar({
  botId,
  size = 40,
  blobs = false,
}: {
  botId: string;
  size?: number;
  blobs?: boolean;
}) {
  const id = useId();
  const seed = hash(botId);
  const accent = botAccent(botId);
  const eyeY = pick(seed, 3, 38, 46);
  const eyeGap = pick(seed, 7, 13, 18);
  const eyeH = pick(seed, 11, 10, 15);
  const tilt = pick(seed, 15, 0, 10) - 5;
  const blobCircles = [
    { cx: pick(seed, 2, 0, 20), cy: pick(seed, 6, 0, 25), r: 30, opacity: 0.3 },
    { cx: pick(seed, 10, 80, 100), cy: pick(seed, 14, 0, 25), r: 28, opacity: 0.4 },
    { cx: pick(seed, 18, 0, 20), cy: pick(seed, 22, 75, 100), r: 28, opacity: 0.5 },
    { cx: pick(seed, 26, 80, 100), cy: pick(seed, 4, 75, 100), r: 26, opacity: 0.65 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={blobs ? "-45 -45 190 190" : "0 0 100 100"}
      role="img"
      aria-label="Bot avatar"
      className="shrink-0"
    >
      {blobs && (
        <>
          <defs>
            <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          <g filter={`url(#${id}-blur)`}>
            {blobCircles.map((blob, i) => (
              <circle key={i} {...blob} fill={accent} fillOpacity={blob.opacity} />
            ))}
          </g>
        </>
      )}
      <circle cx="50" cy="50" r="46" fill={accent} />
      <circle cx="50" cy="50" r="46" fill="white" fillOpacity="0.12" />
      <g transform={`rotate(${tilt} 50 50)`}>
        <rect
          x={50 - eyeGap - 4}
          y={eyeY - eyeH / 2}
          width="8"
          height={eyeH}
          rx="4"
          fill="white"
        />
        <rect
          x={50 + eyeGap - 4}
          y={eyeY - eyeH / 2}
          width="8"
          height={eyeH}
          rx="4"
          fill="white"
        />
      </g>
    </svg>
  );
}
