# Anatomy Motion: style brief and tokens

Status: awaiting sign-off. Nothing is built yet.

## What the references are

One instrument-panel system on a near-black green-teal field:

- **Field.** Dot grid plus a faint line grid, a few long diagonal construction lines, large thin concentric arcs behind the subject.
- **Subject.** A body drawn as white point cloud and hairline wire. It is the brightest neutral thing on screen.
- **One hot colour.** Orange-red, used only for the selected organ (solid, lit, soft glow) and a handful of tiny tags (status dot, "B4" chip, one segment of a progress strip, one waveform). Nothing else is coloured.
- **Type.** Wide squared caps for titles and numerals, tiny tracked caps for micro labels. Organ title has an offset ghost echo.
- **Furniture.** Status bar ("ONLINE ..."), ruler tick bars top and bottom, corner brackets, ring widget top-left, ports grid top-right, FEEDS block bottom-left, bottom ticker, 01-05 tabs, leader lines from organ to card.
- **Per organ.** Heart: PULSE readout with waveform in a ring. Lungs: vertical STATS / VOLUME block. Digestive: PHYSIOLOGY bullet lines and an outlined "LARGE INTESTINE" tag. Brain: waveform monitor.

## What we take, and what we change

Take: the field, the white point-cloud body, the single orange accent, the ghost-echo title, leader lines, the ring widget, ports grid, ruler bars, ticker and tab row.

Change:

- **Furniture must mean something.** The references are decorative. Here the ring widget shows camera orbit angle, the ports grid shows which model parts are loaded and which is selected, the ruler shows body height in cm, the status bar shows load state and frame rate tier. No fake numbers.
- **Body text is sentence case.** The references set paragraphs in tiny all caps, which is hard to read. Caps stay for labels and titles only.
- **No German placeholder copy**, no invented IDs.
- **Stand-ins carry a visible "STYLISED" tag** and render dashed, so they can never be mistaken for scan-derived models.

## Palette (OKLCH, measured)

One neutral ramp at hue 180 (green-teal), one accent ramp at hue 40-52 (orange-red). `signal` is the neutral hue with more chroma, used for leader lines and arcs only. No status colours; the product renders none.

### Dark (default)

| Token | OKLCH | sRGB | Role |
|---|---|---|---|
| `--color-bg-page` | `0.165 0.012 180` | `#09100e` | Field |
| `--color-bg-surface` | `0.205 0.014 180` | `#101917` | Card scrim, sheet |
| `--color-grid` | `0.30 0.016 180` | `#25312e` | Grid, decorative only |
| `--color-line` | `0.58 0.022 180` | `#6d7f7b` | Borders, brackets, ticks |
| `--color-text-primary` | `0.955 0.008 180` | `#ebf2f0` | Titles, body |
| `--color-text-secondary` | `0.80 0.016 180` | `#b3c1be` | Body secondary |
| `--color-text-tertiary` | `0.67 0.02 180` | `#899996` | Micro labels |
| `--color-signal` | `0.80 0.075 180` | `#86cebf` | Leader lines, arcs |
| `--color-accent-solid` | `0.68 0.195 42` | `#f6641b` | Selected organ, chips |
| `--color-accent-text` | `0.78 0.14 52` | `#fd9c5d` | Organ title, live values |
| `--color-on-accent` | `0.165 0.012 180` | `#09100e` | Text on accent chip |

### Light ("paper chart")

| Token | OKLCH | sRGB |
|---|---|---|
| `--color-bg-page` | `0.955 0.008 180` | `#ebf2f0` |
| `--color-bg-surface` | `0.985 0.004 180` | `#f7fbfa` |
| `--color-grid` | `0.87 0.012 180` | `#ccd7d4` |
| `--color-line` | `0.60 0.02 180` | `#748481` |
| `--color-text-primary` | `0.23 0.02 180` | `#12201d` |
| `--color-text-secondary` | `0.40 0.022 180` | `#3b4c48` |
| `--color-text-tertiary` | `0.50 0.022 180` | `#566864` |
| `--color-signal` | `0.50 0.075 180` | `#277165` |
| `--color-accent-solid` | `0.63 0.185 42` | `#e0570f` |
| `--color-accent-text` | `0.52 0.155 40` | `#af400f` |
| `--color-on-accent` | `0.165 0.012 180` | `#09100e` |

In light mode the body draws as dark ink points on paper; the organ stays orange.

### Measured contrast (WCAG 2 ratio, APCA Lc)

Computed from the declared token pairs with a script, not estimated. All values are in sRGB gamut.

| Pair | Dark | Light | Needs |
|---|---|---|---|
| text-primary on bg-page | 16.91, Lc 98 | 14.76, Lc 95 | 4.5 |
| text-primary on bg-surface | 15.70, Lc 97 | 16.10, Lc 101 | 4.5 |
| text-secondary on bg-page | 10.36, Lc 67 | 8.01, Lc 82 | 4.5 |
| text-secondary on bg-surface | 9.62, Lc 66 | 8.73, Lc 88 | 4.5 |
| text-tertiary on bg-page | 6.49, Lc 45 | 5.22, Lc 71 | 4.5 |
| text-tertiary on bg-surface | 6.02, Lc 44 | 5.69, Lc 77 | 4.5 |
| accent-text on bg-page | 9.23, Lc 62 | 5.20, Lc 70 | 4.5 |
| accent-text on bg-surface | 8.56, Lc 61 | 5.67, Lc 76 | 4.5 |
| on-accent on accent-solid | 6.18, Lc 46 | 5.09, Lc 39 | 4.5 |
| accent-solid on bg-page | 6.18 | 3.32 | 3 |
| line on bg-page | 4.54 | 3.44 | 3 |
| line on bg-surface | 4.21 | 3.75 | 3 |
| signal on bg-page | 10.63 | 5.07 | 3 |
| grid on bg-page | 1.42 | 1.30 | decorative |

Notes:

- Every pair passes WCAG AA. On APCA, dark `text-secondary` (Lc 67) sits under the Lc 75 body-text level, so paragraphs use `text-primary` and `text-secondary` is kept for short labels. Dark `text-tertiary` (Lc 45) is for micro labels at 11 px and up, never sentences.
- Not verified yet: text over the WebGL scene. Cards get an opaque-enough `bg-surface` scrim so the pair above is the rendered pair; this gets measured in the browser at the quality gate.
- `prefers-contrast: more` raises `line` to the `text-secondary` value and makes card scrims fully opaque, per theme.

## Type

Two families, both open licence.

- **Oxanium** (variable, 400-700): squared, slightly octagonal. Titles, numerals, tabs, tags. Closest match to the reference numerals and "ANATOMY" lettering.
- **IBM Plex Mono** (400, 500): micro labels, readouts (tabular figures stop counters from jittering), body copy.

Fallback stack if fonts are not loaded: `ui-monospace, "Cascadia Mono", Consolas, monospace` for both.

| Token | Size / line | Family, weight | Tracking | Use |
|---|---|---|---|---|
| `--type-title` | clamp(28px, 7.5vw, 56px) / 1.0 | Oxanium 600, caps | 0.06em | Organ title and echo |
| `--type-heading` | 15px / 1.2 | Oxanium 600, caps | 0.14em | ABOUT, STATS, PHYSIOLOGY |
| `--type-readout` | clamp(28px, 6vw, 40px) / 1.0 | Oxanium 500 | 0.02em | Pulse, volume values |
| `--type-body` | 14px / 1.55 (15px at 1440) | Plex Mono 400 | 0 | Card paragraphs |
| `--type-label` | 11px / 1.3 | Plex Mono 500, caps | 0.12em | Micro labels, ticker |
| `--type-tab` | 16px / 1 | Oxanium 600 | 0.04em | 01-05 |

Body measure capped at 46ch.

## Spacing, lines, shape

- **Spacing scale (4 px base):** 4, 8, 12, 16, 24, 32, 48, 64. Screen gutter 16 px at 390, 32 px at 1440.
- **Field grid:** 24 px dot pitch, line every 120 px (5 cells). HUD blocks snap to the 24 px pitch.
- **Line weights:** hairline 1 px (grid, ticks, leader lines, brackets); emphasis 1.5 px (tab boxes, tag outlines, ring widget); selected 2 px (active tab, focus ring is 2 px `accent-text` with 2 px offset).
- **Radius:** 0 everywhere. Corners are square or 45-degree chamfered, as in the references. Circles only for ring widgets and node dots.
- **Leader lines:** 1 px `signal`, 3 px node dot at the organ end, small square at the card end.
- **Touch targets:** 44 px minimum; tabs are 48 px boxes.
- **Glow:** only on the selected organ (WebGL emissive plus a soft sprite halo). No glow on text or HUD lines.

## Motion tokens

| Token | Value | Use |
|---|---|---|
| `--spring-touch` | damping 1.0, response 0.35 s | Tabs, cards, sheet, press states |
| `--spring-camera` | damping 1.0, response 0.5 s | Camera framing, retargetable mid-flight |
| `--spring-flick` | damping 0.8, response 0.4 s | Only after a flick release |
| `--press-scale` | 0.97 on pointer-down | Tabs, buttons |
| `--draw-in` | 280 ms stagger 40 ms | Leader line, then card, then counters |

Springs run in JS from the live value so any animation can be retargeted or grabbed. HUD animates `transform` and `opacity` only. Reduced motion: camera cross-fades position over 150 ms with no travel, counters show final values, breathing and auto-rotate stop.

## Layout

- **390 px:** canvas is full-bleed. Status bar and ruler on top, ring widget top-left at reduced size, ports grid collapses to a single strip. Organ card is a bottom sheet (draggable: peek, half, full; rubber-bands at the ends). Tabs sit above the ticker, inside the safe area.
- **1440 px:** canvas full-bleed, body centred. Left rail: ring widget, STATS / readout, FEEDS. Right rail: ports grid, ABOUT card, PHYSIOLOGY. Leader lines run from organ to the right-rail card. Tabs centred at the bottom above the ruler and ticker.
