import React from 'react';

export default function Logo({ width = 160, height = 40 }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* "HR" Text in Primary Red */}
      <text 
        x="10" 
        y="35" 
        fill="#E30613" 
        fontFamily="'Inter', sans-serif" 
        fontWeight="800" 
        fontSize="30" 
        letterSpacing="-0.03em"
      >
        HR
      </text>
      {/* "Payroll" Text in Primary Blue */}
      <text 
        x="60" 
        y="35" 
        fill="#0047B8" 
        fontFamily="'Inter', sans-serif" 
        fontWeight="700" 
        fontSize="30" 
        letterSpacing="-0.03em"
      >
        Payroll
      </text>
      {/* Decorative clean underdot in Red */}
      <circle cx="185" cy="31" r="4.5" fill="#E30613" />
    </svg>
  );
}
