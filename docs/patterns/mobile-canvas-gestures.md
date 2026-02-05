# Mobile Canvas Gestures (Pan/Zoom) – Debugging Pattern

## Summary
Mobile users could not pan or zoom the canvas. The page would scroll a little, but the canvas was effectively “dead.” Desktop resized to mobile width reproduced the issue. Final fix made touch gestures work again and added double-tap zoom as a reliable fallback.

## Symptoms
- iPhone/iPad: page scroll only; canvas doesn’t pan or zoom.
- Desktop at mobile widths: same lockup, no pointer interaction.
- Buttons/header still clickable, but canvas stuck.

## Root Causes
1. Touch event handling blocked by browser defaults
   - React’s event system defaults to passive touch listeners on mobile Safari, so preventDefault() had no effect. The browser handled scrolling/zooming instead of our canvas gestures.
2. Global touch-action: none on body (historical)
   - This kills all touch input on iOS if applied at the wrong scope. It caused “nothing works” behavior in prior attempts.
3. Pinch sensitivity too tight
   - The pinch threshold was too strict, making zoom inconsistent.
4. Deploy pipeline issues
   - Vercel builds failed because next was missing from package.json and the lockfile got out of sync. This blocked rapid iteration and testing.

## Fixes Implemented
1. Native touch handlers with passive: false on the canvas container
   - Added direct DOM listeners and explicitly called preventDefault() to stop the browser from hijacking scroll/zoom.
   - File: apps/web/src/hooks/usePanZoom.ts
2. Scoped touch handling to canvas (no global touch-action: none)
   - Removed/avoided global touch-action; kept overscroll prevention without killing input.
   - Files: apps/web/src/app/globals.css, apps/web/src/components/layout/CanvasLayout.tsx
3. Double-tap zoom fallback
   - Added double-tap gesture to zoom in/out with a visible tip.
   - Files: apps/web/src/hooks/usePanZoom.ts, apps/web/src/components/canvas/PixelCanvas.tsx
4. Pinch threshold loosened
   - Reduced pinch threshold to make zoom register more reliably.
   - File: apps/web/src/hooks/usePanZoom.ts
5. Deploy fixes
   - Added next to dependencies and updated pnpm-lock.yaml to satisfy frozen lockfile in CI.
   - Files: package.json, pnpm-lock.yaml

## Verification
- iPad: buttons work and canvas can pan/zoom.
- iPhone: canvas loads; double-tap zoom works; pinch works with improved sensitivity.
- Production alias: https://aiplaces.art

## Prevention (Guardrails)
1. Never use touch-action: none on body or html.
   - Only apply it to the canvas container if needed.
2. Use native listeners for touch with { passive: false }.
   - React’s passive defaults on iOS will ignore preventDefault().
3. Always test mobile by shrinking desktop width.
   - If it breaks in a narrow desktop viewport, it’s not “mobile-only.”
4. Provide a fallback gesture.
   - Double-tap zoom gives a reliable alternative to finicky pinch.
5. Keep deploy unblocked.
   - next must be in dependencies or devDependencies.
   - Keep pnpm-lock.yaml in sync with package.json.
