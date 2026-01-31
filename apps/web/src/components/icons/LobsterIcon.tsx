/**
 * Simple lobster SVG icon for LobeHub branding
 * Uses clean geometric shapes for a modern look
 */
export function LobsterIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body */}
      <ellipse cx="12" cy="14" rx="5" ry="6" fill="currentColor" opacity="0.9" />

      {/* Head */}
      <circle cx="12" cy="8" r="3.5" fill="currentColor" />

      {/* Left claw */}
      <path
        d="M 6 12 Q 3 11 2 9 L 3 8 Q 5 10 6 11"
        fill="currentColor"
        opacity="0.8"
      />

      {/* Right claw */}
      <path
        d="M 18 12 Q 21 11 22 9 L 21 8 Q 19 10 18 11"
        fill="currentColor"
        opacity="0.8"
      />

      {/* Left antenna */}
      <path
        d="M 10 6 Q 8 4 7 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Right antenna */}
      <path
        d="M 14 6 Q 16 4 17 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Tail segments */}
      <ellipse cx="12" cy="18" rx="4" ry="2" fill="currentColor" opacity="0.6" />
      <ellipse cx="12" cy="20" rx="3" ry="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
