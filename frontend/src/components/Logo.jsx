import React from 'react';

/**
 * HR Allocate official brand logo — rendered from the actual PNG asset.
 *
 * Props:
 *  - height (number): rendered height in px. Width scales proportionally. Default 48.
 *  - style (object): optional extra inline styles.
 */
export default function Logo({ height = 48, style = {} }) {
  return (
    <img
      src="/logo.png"
      alt="HR Allocate — HR & Payroll Solutions"
      height={height}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        flexShrink: 0,
        ...style
      }}
    />
  );
}
