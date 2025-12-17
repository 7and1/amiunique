# AmiUnique "Neo-SaaS" UI System

AmiUnique.io needs to read as a privacy-grade analytics product: serious, data-forward, yet approachable.
This document translates the product vision into implementable UI guidance for `apps/web` (Next.js 14 + Tailwind).
It covers theming, layout, critical components, motion, and accessibility so designers and engineers can
ship consistently across Light and Dark modes.

## 1. Brand Pillars
- **Transparency** – glassmorphic cards with subtle gradients signal that the platform reveals what tracking systems hide.
- **Distribution Awareness** – every primary screen references the bell curve metaphor to situate the user among millions of fingerprints.
- **Clinical Cleanliness** – wide spacing, restrained color accents, and uncluttered typography keep attention on data quality.

## 2. Typography Stack
| Use Case | Font | Notes |
| --- | --- | --- |
| Display & Headings | Geist Sans, `font-['Geist','Inter',sans-serif]` | Optical sizes 48/64 px for hero, 32 px for sections; tracking-tight.
| Body & UI | Geist Sans Regular | 15–16 px base, 24 px line height.
| Data, Code, Metrics | Geist Mono, `font-['Geist_Mono','IBM Plex Mono',monospace]` | Use for hash strings, percentages, table values.

Load both font families via next/font (self-host from `apps/web/public/fonts`) to avoid CLS and control subsets.

## 3. Color System
| Token | Light Mode | Dark Mode | Usage |
| --- | --- | --- | --- |
| `bg.app` | `#f8f9fb` (Zinc-50) | `#09090b` (Zinc-950) | Base background.
| `bg.card` | `#ffffff` | `#18181b` (Zinc-900) | Surfaces + cards.
| `border.card` | `linear(0deg,#ffffff66,#d6d6d600)` | `linear(180deg,#3f3f4666,#0f0f1099)` | Glass edges for transparency cue.
| `text.primary` | `#0f172a` | `#f8fafc` | Headings + hero copy.
| `text.secondary` | `#475569` | `#cbd5f5` | Body text.
| `accent.unique` | `#f59e0b` (Amber-500) | `#fbbf24` | Highlights when uniqueness is dangerously high.
| `accent.common` | `#0d9488` (Teal-500) or `#6366f1` (Indigo-500) | lighten/darken 10% | Signals safety/common.
| `data.neutral` | `#64748b` (Slate-500) | `#94a3b8` | Axis, labels.

Gradients should stay desaturated (opacity 0.2–0.35) to maintain "clean lab" feel.

## 4. Layout Structure
1. **Hero (Fold)**
   - Max 4 columns (grid) or centered stack.
   - Headline: "Are you unique on the web?" with accent gradient.
   - Subheadline references dataset size ("2M+ fingerprints").
   - CTA: "Scan Me" button (see §6.3) + supporting text (live counter, privacy promise).
2. **Identity Bell Curve Section**
   - Full-bleed chart container with gradient background.
   - Animated bell curve with highlight dot tied to uniqueness percentile.
   - Tooltip bubble `You are here (1 in n)` updates in real time.
3. **Detailed Breakdown Grid**
   - 4 columns (Hardware, Software, Network, Behavior).
   - Each column includes contribution meter bar + cards for sub-metrics.
4. **Deep Dive Sections**
   - Fingerprint cards grid (2–3 columns) showing top attributes with badges.
   - Education blocks (Three Lock explanation, Lie detection, Privacy compliance).

Use `max-w-6xl` or `max-w-7xl` containers with 80–120 px vertical rhythm to keep breathing room.

## 5. Key Components
### 5.1 Identity Bell Curve
- Base is an SVG area chart; use `d3-shape` `area()` with kernel smoothing for fluidity.
- Fill: `linear-gradient(180deg, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0.05) 100%)`.
- Stroke: 2 px Indigo-500.
- Animated dot: radial gradient (`accent.unique` → transparent) pulsating scale 0.9–1.05.
- Tooltip bubble styled as frosted glass card with Geist Mono numeric readouts; include percentile + accessible text.
- Provide motion-reduced fallback (static dot) for users with `prefers-reduced-motion`.

### 5.2 Fingerprint Card Grid
- Two-column layout inside `grid gap-6 md:grid-cols-2 xl:grid-cols-3`.
- Each card: `rounded-2xl border border-white/20 dark:border-zinc-800 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)]`.
- Rows: label left (12 px uppercase Geist Mono), value right (Geist Sans Semibold), uniqueness badge adjacent.
- Badges: pill with gradient background (Amber for ≤0.1%, Slate for ≥10%). Use icons (triangle vs shield) for quick scanning.

### 5.3 "Scan Me" Button
- Dimensions: min 280×72 px.
- Style: `rounded-full`, double border effect (outer glow + inner gradient border) to mimic scanner ring.
- Idle gradient: `from-amber-400 via-orange-500 to-pink-500`; box shadow 0 20 50 Amber-400/25.
- Hover/active: animate background blur and show animated fingerprint icon (SVG lines) with `stroke-dashoffset` loop.
- On click: morph into scanning state
  1. Button expands horizontally (280→360 px) while label swaps to `Scanning browser fingerprint...`.
  2. Show progress ticker using CSS mask stripes sliding vertically to resemble scanner beam.
  3. Use React state to trigger `ScanButton` -> `ScannerPanel` component that drives loading timeline.

### 5.4 Contribution Meter
- For each pillar (Hardware, Software, Network, Behavior) render vertical meter with 0–100% unique contribution.
- `bg` uses `accent.common` gradient; overlay amber dot when >70% unique.
- Include textual verdict like "Hardware looks common" vs "Fonts too unique".

### 5.5 Metric Badges
- `Unique`: Amber background `bg-amber-500/15 text-amber-400 border border-amber-500/30`.
- `Common`: Slate background `bg-slate-500/15 text-slate-300 border border-slate-500/20`.
- `Flagged`: Rose background `bg-rose-500/15 text-rose-300 border border-rose-500/30` for lie detection.

## 6. Motion & Micro-interactions
- Bell curve dot pulsing every 2.4 s.
- Fingerprint cards lift (`translate-y-[-4px]`) on hover with gradient border flicker.
- Scroll-based reveal for sections (use `framer-motion` but guard behind `useReducedMotion`).
- "Scan Me" entry uses 300 ms spring scaling to feel tactile.
- Loading timeline should emit events for each collector so `apps/web/src/components/scan/timeline.tsx` can animate text updates ("Collecting codecs", "Measuring fonts", etc.).

## 7. Tailwind Configuration Notes
Update `apps/web/tailwind.config.ts` theme section:
```ts
const colors = require('tailwindcss/colors');

export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          base: '#f8f9fb',
          dark: '#09090b',
          card: '#ffffff',
          cardDark: '#18181b'
        },
        accent: {
          unique: '#f59e0b',
          common: '#0d9488',
          indigo: '#6366f1'
        },
        data: {
          neutral: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'IBM Plex Mono', 'monospace']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        glow: '0 25px 60px rgba(245, 158, 11, 0.25)'
      }
    }
  }
};
```
Pair this with `app/globals.css` utility classes for gradient borders (e.g., `.gradient-border { border: 1px solid transparent; background: linear-gradient(#fff, #fff) padding-box, linear-gradient(120deg, rgba(99,102,241,.8), rgba(14,165,233,.4)) border-box; }`).

## 8. Accessibility & Performance
- Respect `prefers-reduced-motion` by disabling pulsing animations and scanner beam.
- Maintain 4.5:1 contrast for text on all surfaces (Amber on white must use darker shade or overlay).
- Provide textual equivalents for uniqueness verdict ("Your fingerprint is rarer than 99.99% of browsers").
- Keep gradients GPU friendly (limit blur/backdrop layers) to preserve 60fps on low-end devices.
- Lazy load heavy visualizations (bell curve) below the fold; wrap inside dynamic import to prevent Next.js blocking hydration.

## 9. Implementation Checklist
1. Load Geist fonts and configure Tailwind tokens (§2 & §7).
2. Build `ScanButton` with scanning state machine and event hooks.
3. Implement `IdentityBellCurve` component (SVG + tooltip) backed by real percentile data from API response.
4. Create `FingerprintCardGrid` and `ContributionMeter` components, parameterized for both Light and Dark themes.
5. Wire up detail sections for the four pillars with modular data arrays (improves maintainability and testability).
6. Add regression stories in Storybook (if available) or dedicated Playwright visual tests for light/dark modes to ensure design stays consistent.

Following this spec keeps AmiUnique distinct from Pixelscan.dev and BrowserLeaks.io by emphasizing statistical storytelling through a modern SaaS lens.
