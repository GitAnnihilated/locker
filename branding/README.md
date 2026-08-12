# Locker logo

## Concept
A rounded-square "workspace" container has an L-shaped channel cut through it —
the letterform **L**, a **doorway** breaching out to the edge (not a sealed
vault), and the silhouette of a **keyhole** all in one shape. A solid accent
circle sits where a keyhole's head would be, reframed as a **connection
node** — someone present in the shared space. Deliberately not a padlock: no
shackle, no cybersecurity cliché, reads as an abstract app-icon mark first.

## Files
- `icon-color.svg` / `icon-color.png` (+ `favicon-64.png`, `app-icon-512.png`) — icon only, navy + accent, transparent background.
- `icon-mono.svg` / `icon-mono.png` — icon only, single color (black), transparent background.
- `horizontal-color.svg` / `horizontal-color.png` — primary lockup, icon + "Locker" wordmark, transparent background.
- `horizontal-mono.svg` / `horizontal-mono.png` — monochrome lockup, single color.
- `sheet.png` / `sheet.svg` — presentation sheet showing all three together (white background).

## Specs
- Primary navy `#101F3D`, accent blue `#3E6BE0` (used only for the node circle — everything else is monochrome navy).
- Wordmark: "Locker" set in Outfit Bold, letterforms converted to vector outlines (no font dependency at render/print time), light negative tracking with manual kerning on L–o, c–k, k–e.
- Flat fills only — no gradients, shadows, or effects, so it holds up at favicon size and in pure black and white.
- SVGs are the source of truth — resize losslessly for any use (favicon, app icon, navbar, print).

## Regenerating
`python build_logo.py` (rebuilds the SVGs) then `node rasterize.js` (rasterizes to PNG via `sharp`, already a project dependency).
