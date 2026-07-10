import React from "react";

// The real Skillvanto mark — three team members rising out of a checkmark,
// rendered as inline SVG (no image asset to ship/load) so it scales cleanly
// and recolors for light/dark contexts via the markColor prop.
export default function Logo({ size = 34, wordmarkColor = "#fff", markColor = "#fff" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={{ flexShrink: 0 }}>
        <g fill={markColor}>
          <circle cx="60" cy="38" r="13" />
          <circle cx="100" cy="30" r="13" />
          <circle cx="140" cy="38" r="13" />
          <path d="M42,95 L46,58 L56,54 L60,62 L64,54 L74,58 L78,95 Z" />
          <path d="M82,88 L86,50 L96,46 L100,54 L104,46 L114,50 L118,88 Z" />
          <path d="M122,95 L126,58 L136,54 L140,62 L144,54 L154,58 L158,95 Z" />
          <path d="M30,92 L170,52 L170,76 L92,168 L30,108 Z" />
        </g>
      </svg>
      <span
        className="serif"
        style={{
          fontSize: size * 0.62, fontWeight: 700, color: wordmarkColor,
          letterSpacing: "0.02em", lineHeight: 1,
        }}
      >
        SKILLVANTO
      </span>
    </div>
  );
}
