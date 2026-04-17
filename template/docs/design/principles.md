---
title: Design Principles
based-on: []
owns-labels: ["area:design"]
spawns-issues-on-change: []
---

# Design Principles

The non-visual rules that every UI decision is checked against. Principles beat style guides — they outlive component choices.

## Core principles

<!--
3–7 principles, no more. Each one is a short name + one sentence + an example of what it excludes.

Example:
### Clarity over cleverness
If a user has to pause to decode a UI element, the element is wrong.
We reject: ambiguous icons without labels, trendy animations that delay action, invented jargon.
-->

### _(principle)_

_(one-sentence rule)_

## Tone of voice

<!--
How the product speaks. Examples of what we say and don't say.
Useful even if there's no heavy copy — buttons, errors, and empty states all have tone.
-->

## Accessibility commitments

- WCAG level: _(fill — 2.2 AA is a common baseline)_
- Keyboard-only operation must reach every interactive element
- Colour contrast: text ≥ 4.5:1, large text ≥ 3:1, UI components ≥ 3:1
- No information conveyed by colour alone
- Focus indicators never removed

## Motion

- Respect `prefers-reduced-motion`
- No spinners for under 1s operations (use optimistic UI instead)
- Maximum animation duration: _(fill)_

## Decision-making process

When two principles conflict, the order is: _(rank your top 3 — e.g., accessibility > clarity > brevity)_.
