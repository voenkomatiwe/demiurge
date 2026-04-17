---
title: Design System — Master
based-on: []
owns-labels: ["area:design", "area:ui"]
spawns-issues-on-change:
  - section: "### Colors (semantic)"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "### Fonts"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "### Typography"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "### Spacing (4-point scale)"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "### Radius"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "### Shadows"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "### Z-Index"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "### Motion"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "### Breakpoints (mobile-first)"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:refactor"]
  - section: "## Dark Mode (opt-in)"
    labels: ["role:designer", "role:frontend", "area:design", "area:ui", "type:feature"]
---

# Design System — Master

> Source of truth for design tokens, global rules, and anti-patterns.
> Page-specific overrides live in `docs/design/pages/<page>.md`.
> **Hard cap: 500 lines.** If this file grows past that, move rationale to an ADR (`docs/design/decisions/NNNN-<slug>.md`) instead of bloating the master.

## Domain & Tone

- **Product**: see [docs/vision.md](../vision.md)
- **Audience**: TBD — fill from vision at first real design task
- **Tone**: TBD — pick one extreme and commit (see the `frontend-design` skill's "Design Thinking" section in Claude Code)
- **Differentiation**: TBD — the one thing users should remember

## Design Tokens

Tokens map 1:1 to Tailwind v4 `@theme` in `frontend/src/styles/globals.css`. **Never use raw hex in page files** — reference token names only.

### Colors (semantic)

Single light-mode palette. Dark mode is **opt-in** — see the **Dark Mode** section at the bottom of this file. Only add the dark column when the vision explicitly asks for it.

| Token | Value | Usage |
|---|---|---|
| `background` | TBD | Page background |
| `foreground` | TBD | Body text on `background` |
| `card` | TBD | Card/panel surface (distinct from `background`) |
| `card-foreground` | TBD | Text on `card` |
| `popover` | TBD | Tooltip / dropdown / menu surface |
| `popover-foreground` | TBD | Text on `popover` |
| `primary` | TBD | Primary actions, brand |
| `primary-foreground` | TBD | Text/icons on `primary` |
| `secondary` | TBD | Secondary actions, chips |
| `secondary-foreground` | TBD | Text on `secondary` |
| `muted` | TBD | Subdued surfaces (disabled bg, placeholders) |
| `muted-foreground` | TBD | Subdued text (captions, hints) |
| `accent` | TBD | Hover bg for menu items, tabs, interactive cells |
| `accent-foreground` | TBD | Text on `accent` |
| `border` | TBD | Dividers, card borders |
| `input` | TBD | Input field background / border (if distinct) |
| `ring` | TBD | Focus ring (must contrast ≥ 3:1 against adjacent bg) |
| `destructive` | TBD | Errors, destructive actions (delete, revoke) |
| `destructive-foreground` | TBD | Text on `destructive` |
| `success` | TBD | Success states (confirmations, passed checks) |
| `success-foreground` | TBD | Text on `success` |
| `warning` | TBD | Warnings (non-blocking risk, unsaved changes) |
| `warning-foreground` | TBD | Text on `warning` |
| `info` | TBD | Informational callouts, neutral highlights |
| `info-foreground` | TBD | Text on `info` |

**A11y requirements** (non-negotiable):
- Every `*-foreground` pair reaches contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text (≥ 18pt or ≥ 14pt bold).
- `ring` reaches ≥ 3:1 against every surface it can appear on (`background`, `card`, `popover`, `input`).
- `destructive`, `warning`, `success`, `info` are **never** the only signal — always pair with an icon or label.

### Fonts

| Slot | Family | Usage |
|---|---|---|
| `font-sans` | TBD | Body, UI, inputs — default everywhere |
| `font-display` | TBD | Headings; may alias to `font-sans` for single-font projects |
| `font-mono` | TBD | Code blocks, inline code, tabular numbers |

### Typography

| Token | Slot | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| `display` | `font-display` | TBD | TBD | TBD | TBD |
| `h1` | `font-display` | TBD | TBD | TBD | TBD |
| `h2` | `font-display` | TBD | TBD | TBD | TBD |
| `h3` | `font-display` | TBD | TBD | TBD | TBD |
| `h4` | `font-sans` | TBD | TBD | TBD | TBD |
| `body` | `font-sans` | 1rem | 400 | 1.5 | 0 |
| `body-sm` | `font-sans` | 0.875rem | 400 | 1.5 | 0 |
| `caption` | `font-sans` | 0.75rem | 400 | 1.4 | 0.01em |
| `code` | `font-mono` | 0.875rem | 400 | 1.5 | 0 |

### Spacing (4-point scale)

| Token | rem | px | Tailwind class example |
|---|---|---|---|
| `0` | 0 | 0 | `p-0`, `gap-0` |
| `0.5` | 0.125rem | 2 | `p-0.5` — hairline adjustments |
| `1` | 0.25rem | 4 | `p-1`, `gap-1` |
| `2` | 0.5rem | 8 | `p-2`, `m-2` |
| `3` | 0.75rem | 12 | `p-3`, `gap-3` |
| `4` | 1rem | 16 | `p-4` — default card inner padding |
| `6` | 1.5rem | 24 | `p-6`, section gutters |
| `8` | 2rem | 32 | `py-8` — section vertical rhythm |
| `12` | 3rem | 48 | `py-12` — large sections |
| `16` | 4rem | 64 | `py-16` — hero vertical |

### Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 0.25rem | Badges, small buttons |
| `radius-md` | 0.5rem | Inputs, default buttons |
| `radius-lg` | 0.75rem | Cards, popovers |
| `radius-xl` | 1rem | Dialogs, large containers |
| `radius-full` | 9999px | Pills, avatars |

### Shadows

Elevation scale used by cards, popovers, dialogs, and toasts. Agents **must not** write arbitrary `shadow-[0_4px_...]` values — pick one from this table or add a new tier via an ADR in `docs/design/decisions/`.

| Token | Usage |
|---|---|
| `shadow-xs` | Input focus halos, pressed buttons |
| `shadow-sm` | Cards at rest, low-prominence surfaces |
| `shadow-md` | Dropdowns, popovers, hover-raised cards |
| `shadow-lg` | Dialogs, command palettes |
| `shadow-xl` | Toasts, top-layer notifications |
| `shadow-inner` | Input depression, pressed states |

### Z-Index

Layering scale. Never hardcode `z-[9999]`. Add a new tier only via an ADR in `docs/design/decisions/`.

| Token | Value | Usage |
|---|---|---|
| `z-base` | 0 | Page content, default layer |
| `z-dropdown` | 1000 | Select menus, autocomplete |
| `z-sticky` | 1100 | Sticky headers, sticky table rows |
| `z-overlay` | 1200 | Backdrops, scrims behind modals |
| `z-modal` | 1300 | Dialogs, drawers, command palettes |
| `z-popover` | 1400 | Popovers, tooltips rendered above modals |
| `z-toast` | 1500 | Toasts, top-layer notifications |

### Icons

- **Library**: Lucide React only. Never emoji as a UI affordance.
- **Sizes**: `icon-xs` 12×12 · `icon-sm` 16×16 · `icon-md` 20×20 (default) · `icon-lg` 24×24 · `icon-xl` 32×32.
- **Touch target**: ≥ 44×44px including padding around the icon. Wrap small icons in an adequately padded button; never scale the icon itself to meet the target.
- **Stroke width**: Lucide default (2) unless the project explicitly overrides it in this file.

### Motion

- **Duration scale**: `duration-fast` 100ms · `duration-normal` 150ms · `duration-slow` 300ms · `duration-slower` 500ms.
- **Easing**: `ease-out` (default for enter) · `ease-in` (exit) · `ease-in-out` (state transitions) · `ease-out-expo` (emphasized enter for hero animations).
- **Default transition**: `150ms ease-out` unless a component spec overrides it.
- `prefers-reduced-motion: reduce` **must** short-circuit every non-essential transition to `duration-fast` or 0ms. Never block content behind a long animation.

### Breakpoints (mobile-first)

- `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px · `2xl` 1536px
- Design at **375** first → verify at **768** → verify at **1440**.

## Global Rules

1. **Accessibility baseline**: contrast ≥ 4.5:1 body text / ≥ 3:1 large text & UI; focus rings on every interactive element; touch targets ≥ 44×44px.
2. **Focus ring spec**: 2px solid `ring` token, 2px offset from the element, visible only on `:focus-visible` (not `:focus`). Keyboard users must see it; mouse clicks must not flash it.
3. **State coverage**: every interactive component documents `default / hover / active / pressed / focus / disabled / read-only / invalid / error / loading / empty`. No exceptions.
4. **Semantic tokens only**: no raw hex, no arbitrary Tailwind values (`bg-[#...]`, `w-[437px]`, `shadow-[...]`, `z-[9999]`) in production. If a design value doesn't match a token → add the token here first, then use it.
5. **Icons**: Lucide only. Never emoji as a UI affordance.
6. **Motion**: intentional, `prefers-reduced-motion` respected. Default transition `150ms ease-out` unless overridden per component.
7. **Color is never the only signal**: status (success/warning/error/info) carries an icon or label alongside the color.

## Dark Mode (opt-in)

> **Skip this section entirely** unless the vision asks for dark mode. When it does:
> 1. Duplicate the Colors table with a `Dark` column alongside the light value.
> 2. Wire the `.dark` class per shadcn/ui convention in `frontend/src/styles/globals.css`.
> 3. Add an ADR in `docs/design/decisions/` documenting the activation strategy (`auto via prefers-color-scheme` vs. `user toggle` vs. `both`).
> 4. Verify every foreground pair meets the same a11y contrast thresholds in dark mode.

```
TBD — palette twin goes here when the project enables dark mode.
```

## Anti-Patterns (domain-specific)

> Populated from the first real design task. Record each one as a short bullet with a one-line reason.

- ❌ Generic purple/pink gradients for "AI-looking" trust screens
- ❌ Inter + grey cards for a product that should feel editorial
- ❌ TBD — fill in as real issues surface from first designs

## Component Inventory

> Populated as components get built. Each entry: name + one-line purpose + file path.

- _none yet_

## References

- [Vision](../vision.md)
- [Design principles](principles.md)
- Design ADRs: `docs/design/decisions/` (or `grep -rli "<keyword>" docs/design/decisions/`)
- Page-specific overrides: `docs/design/pages/`
- Frontend primitives (shadcn if used): `frontend/src/components/ui/`
- Composed components: `frontend/src/components/`
- [Designer role card](../roles/designer.md)
