import { requestContextFromRequest } from "@/lib/request-context";
import { isDemoMode } from "@/security/session";

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ generationId: string; index: string }>;
  },
) {
  if (!isDemoMode() && !requestContextFromRequest(request)) {
    return new Response("Not found", { status: 404 });
  }
  const { generationId, index } = await context.params;
  const seed = hash(`${generationId}:${index}`);
  const palettes = [
    ["#d9ff71", "#1b352c", "#f7f2e8"],
    ["#ff8a68", "#422541", "#f8d8c5"],
    ["#74d7ff", "#16284b", "#e9f8ff"],
    ["#d4a8ff", "#36235a", "#fff3d7"],
  ];
  const palette = palettes[seed % palettes.length];
  const angle = seed % 360;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="#0e1210"/>
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stop-color="${palette[0]}" stop-opacity=".85"/>
          <stop offset="1" stop-color="${palette[0]}" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="35"/></filter>
      </defs>
      <rect width="1200" height="1500" fill="url(#bg)"/>
      <circle cx="${250 + (seed % 600)}" cy="${200 + (seed % 380)}" r="520" fill="url(#glow)" filter="url(#blur)"/>
      <g transform="translate(600 765) rotate(${angle / 18 - 10})">
        <ellipse cx="0" cy="380" rx="280" ry="70" fill="#000" opacity=".35"/>
        <path d="M-175-320 Q-210-235-190 290 Q-170 390 0 415 Q170 390 190 290 Q210-235 175-320Z" fill="${palette[2]}"/>
        <path d="M-175-320 Q0-390 175-320 L130-215 Q0-255-130-215Z" fill="${palette[0]}"/>
        <rect x="-128" y="-110" width="256" height="235" rx="28" fill="${palette[1]}"/>
        <rect x="-95" y="-68" width="190" height="20" rx="10" fill="${palette[0]}"/>
        <circle cx="0" cy="32" r="68" fill="none" stroke="${palette[0]}" stroke-width="12"/>
        <path d="M-72 225H72" stroke="${palette[1]}" stroke-width="14" stroke-linecap="round"/>
      </g>
      <g fill="${palette[2]}">
        <text x="72" y="92" font-family="Arial,sans-serif" font-size="24" font-weight="700" letter-spacing="5">RELAYFRAME / CONCEPT ${Number(index) + 1 || 1}</text>
        <text x="72" y="1340" font-family="Arial,sans-serif" font-size="76" font-weight="700">Calm energy.</text>
        <text x="72" y="1410" font-family="Arial,sans-serif" font-size="76" font-weight="700" fill="${palette[0]}">Clear momentum.</text>
      </g>
      <rect x="72" y="1450" width="240" height="5" fill="${palette[0]}"/>
    </svg>
  `;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": isDemoMode()
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
