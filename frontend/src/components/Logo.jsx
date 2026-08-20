import React from 'react';

/**
 * HR Allocate official brand logo.
 * Renders the red-H / blue-R / person silhouette mark with "Allocate" wordmark
 * and "HR & PAYROLL SOLUTIONS" subtitle — matching the brand identity exactly.
 *
 * Props:
 *  - height (number): rendered height in px, width scales proportionally. Default 52.
 *  - variant: 'full' (default) shows mark + wordmark, 'mark' shows only the HR mark icon.
 */
export default function Logo({ height = 52, variant = 'full' }) {
  if (variant === 'mark') {
    // Square icon-only version for tight spaces (e.g. favicon fallback, avatars)
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={height}
        viewBox="0 0 120 120"
        fill="none"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        {/* Red H */}
        <rect x="6"  y="10" width="14" height="70" rx="3" fill="#EC070D"/>
        <rect x="6"  y="42" width="36" height="14" rx="2" fill="#EC070D"/>
        <rect x="34" y="10" width="14" height="34" rx="3" fill="#EC070D"/>
        {/* Blue R body */}
        <rect x="58" y="10" width="13" height="70" rx="3" fill="#082D71"/>
        {/* R bump */}
        <path d="M71 10 Q100 10 100 32 Q100 52 71 54 Z" fill="#082D71"/>
        <path d="M71 10 Q92 10 92 32 Q92 46 71 48 Z" fill="#EC070D" opacity="0.8"/>
        {/* R leg */}
        <path d="M77 52 L100 80 L88 80 L65 52 Z" fill="#082D71"/>
        {/* Person (white, between H and R) */}
        <circle cx="48" cy="54" r="8" fill="white"/>
        <path d="M34 80 Q34 64 48 64 Q62 64 62 80 Z" fill="white"/>
        {/* Red tie */}
        <path d="M46 64 L44 78 L48 74 L52 78 L50 64 Z" fill="#EC070D"/>
      </svg>
    );
  }

  // Full logo: mark + wordmark
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={height}
      viewBox="0 0 320 90"
      fill="none"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* ── HR Mark ── */}
      {/* Red H */}
      <rect x="4"  y="5"  width="11" height="55" rx="2.5" fill="#EC070D"/>
      <rect x="4"  y="28" width="28" height="11" rx="2"   fill="#EC070D"/>
      <rect x="26" y="5"  width="11" height="28" rx="2.5" fill="#EC070D"/>
      {/* Blue R */}
      <rect x="46" y="5"  width="10" height="55" rx="2.5" fill="#082D71"/>
      <path d="M56 5 Q78 5 78 22 Q78 38 56 40 Z" fill="#082D71"/>
      <path d="M56 5 Q72 5 72 22 Q72 33 56 35 Z" fill="#EC070D" opacity="0.82"/>
      <path d="M61 38 L78 60 L68 60 L51 38 Z" fill="#082D71"/>
      {/* Person silhouette */}
      <circle cx="37" cy="40" r="6.5" fill="white"/>
      <path d="M26 60 Q26 49 37 49 Q48 49 48 60 Z" fill="white"/>
      <path d="M35.5 49 L34 59 L37 56.5 L40 59 L38.5 49 Z" fill="#EC070D"/>

      {/* ── Wordmark ── */}
      {/* "A" in red */}
      <text x="92" y="55" fontFamily="'Arial Black', 'Arial', sans-serif" fontWeight="900" fontSize="40" fill="#EC070D">A</text>
      {/* "llocate" in dark blue */}
      <text x="116" y="55" fontFamily="'Arial Black', 'Arial', sans-serif" fontWeight="900" fontSize="40" fill="#082D71">llocate</text>

      {/* ── Subtitle: HR & PAYROLL SOLUTIONS ── */}
      <line x1="92"  y1="68" x2="108" y2="68" stroke="#EC070D" strokeWidth="1.8"/>
      <text x="112" y="73" fontFamily="'Arial', sans-serif" fontWeight="700" fontSize="10" fill="#082D71" letterSpacing="1">HR &amp; PAYROLL SOLUTIONS</text>
      <line x1="295" y1="68" x2="318" y2="68" stroke="#082D71" strokeWidth="1.8"/>
    </svg>
  );
}
