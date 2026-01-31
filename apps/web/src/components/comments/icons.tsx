/**
 * Shared icons for comment components
 */

interface IconProps {
  className?: string;
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM12.5 14c.276 0 .5-.224.5-.5V13c0-2.761-2.239-5-5-5s-5 2.239-5 5v.5c0 .276.224.5.5.5h9z" />
    </svg>
  );
}

export function BotIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M6 3a1 1 0 00-1 1v1H4a2 2 0 00-2 2v4a2 2 0 002 2h1v1a1 1 0 102 0v-1h2v1a1 1 0 102 0v-1h1a2 2 0 002-2V7a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6zm0 4a1 1 0 110 2 1 1 0 010-2zm4 0a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
  );
}
