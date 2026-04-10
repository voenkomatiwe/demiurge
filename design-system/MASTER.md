# Design System — Master

> Source of truth for design tokens, global rules, and anti-patterns.
> Page-specific overrides live in `design-system/pages/<page>.md`.
> **Hard cap: 500 lines.** If this file grows past that, move rationale to `docs/DECISIONS.md` instead of bloating the master.

## Domain & Tone

- **Product**: see [docs/PROJECT_BRIEF.md](../docs/PROJECT_BRIEF.md)
- **Audience**: TBD — fill from project brief at first real design task
- **Tone**: TBD — pick one extreme and commit (see `frontend-design` skill's "Design Thinking" section)
- **Differentiation**: TBD — the one thing users should remember

## Design Tokens

Tokens map 1:1 to Tailwind v4 `@theme` in `src/styles/globals.css`. **Never use raw hex in page files** — reference token names only.

### Colors (semantic)

| Token | Value | Usage |
|---|---|---|
| `primary` | TBD | Primary actions, brand |
| `primary-foreground` | TBD | Text/icons on primary |
| `background` | TBD | Page background |
| `foreground` | TBD | Body text |
| `muted` | TBD | Secondary surfaces |
| `muted-foreground` | TBD | Secondary text |
| `border` | TBD | Dividers, inputs |
| `destructive` | TBD | Errors, destructive actions |
| `destructive-foreground` | TBD | Text on destructive |

### Typography

| Token | Font | Size | Weight | Line-height |
|---|---|---|---|---|
| `display` | TBD | TBD | TBD | TBD |
| `h1` | TBD | TBD | TBD | TBD |
| `h2` | TBD | TBD | TBD | TBD |
| `h3` | TBD | TBD | TBD | TBD |
| `h4` | TBD | TBD | TBD | TBD |
| `body` | TBD | 1rem | 400 | 1.5 |
| `caption` | TBD | 0.875rem | 400 | 1.4 |

### Spacing & Radius

- **Spacing scale** (4-point): `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`, `4rem`
- **Radius**: `sm=0.25rem`, `md=0.5rem`, `lg=0.75rem`, `xl=1rem`, `full`

### Breakpoints (mobile-first)

- `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px
- Design at **375** first → verify at **768** → verify at **1440**

## Global Rules

1. **Accessibility baseline**: contrast ≥ 4.5:1 body text / ≥ 3:1 large text & UI; focus rings on every interactive element; touch targets ≥ 44×44px.
2. **State coverage**: every interactive component documents default / hover / active / focus / disabled / error / loading / empty.
3. **Semantic tokens only**: no raw hex, no arbitrary Tailwind values (`bg-[#...]`, `w-[437px]`) in production.
4. **Icons**: Lucide only. Never emoji as UI affordance.
5. **Motion**: intentional, `prefers-reduced-motion` respected. Default transition `150ms ease-out` unless overridden per component.

## Anti-Patterns (domain-specific)

> Populated by the `ui-ux-pro-max` skill on the first real design task. To regenerate:
> `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry>" --design-system --persist -p "<project>"`

- ❌ Generic purple/pink gradients for "AI-looking" trust screens
- ❌ Inter + grey cards for a product that should feel editorial
- ❌ TBD — fill in as real issues surface from first designs

## Component Inventory

> Populated as components get built. Each entry: name + one-line purpose + file path.

- _none yet_

## References

- [Project brief](../docs/PROJECT_BRIEF.md)
- [Architecture decisions](../docs/DECISIONS.md)
- Frontend primitives: `src/components/ui/` (shadcn)
- Composed components: `src/components/`
