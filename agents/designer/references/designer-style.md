# Designer Code Style

Reference for the designer agent. Patterns and conventions for UI/UX design specs, design system usage, and frontend handoff.

---

## Design System Location

```
design-system/
├── MASTER.md              # Tokens, global rules, anti-patterns (source of truth)
└── pages/                 # Page-specific design specs
    └── {page-name}.md     # One file per page/view
```

`MASTER.md` is the single source of truth for tokens. Page specs reference tokens by name — never by raw value.

---

## Page Spec Structure

Every page spec in `design-system/pages/` follows this structure:

```markdown
# {Page Name}

## Purpose
One sentence — what this page does for the user.

## Layout
Description of the page grid/structure at each breakpoint (375, 768, 1440).

## Sections
### {Section Name}
- **Component**: which component(s) to use
- **Content**: copy, labels, placeholder text
- **Tokens**: background, text color, spacing, radius
- **States**: default, loading, empty, error
- **Responsive**: what changes per breakpoint

## Interactions
User flows, transitions, what happens on click/submit/hover.

## Accessibility Notes
Anything beyond the global baseline (MASTER.md) that this page requires.
```

**Rules:**
- One page file = one route/view
- Sections ordered top-to-bottom as they appear on the page
- Every section references tokens from `MASTER.md` — never raw hex or pixel values
- If a needed token doesn't exist in `MASTER.md`, add it there first

---

## Component Spec Pattern

When designing a new component, the spec must answer everything the frontend developer needs:

```markdown
### ComponentName

**Purpose:** One sentence.

**Anatomy:**
- Container: `bg-card`, `rounded-lg`, `shadow-sm`, `p-4`
- Header: `text-h4`, `text-foreground`, `mb-2`
- Body: `text-body`, `text-muted-foreground`
- Action: `Button` variant=`primary`, size=`default`

**States:**
| State | Visual change |
|---|---|
| Default | As described above |
| Hover | Container: `shadow-md`, transition `duration-normal ease-out` |
| Active | Container: `shadow-xs` |
| Focus | Focus ring: 2px solid `ring`, 2px offset |
| Disabled | Opacity 50%, no pointer events |
| Loading | Skeleton placeholder, `h-48 w-full rounded-lg` |
| Empty | Centered text: "No items yet", `text-muted-foreground` |
| Error | Border: `border-destructive`, error message below |

**Responsive:**
| Breakpoint | Change |
|---|---|
| 375px | Single column, full width, `p-3` |
| 768px | Two columns, `gap-4` |
| 1440px | Three columns, `gap-6`, max-width container |

**Accessibility:**
- Touch target: ≥ 44x44px (action button)
- Contrast: verified `foreground` on `card` ≥ 4.5:1
- Screen reader: `aria-label` on action if icon-only
```

**Rules:**
- Every interactive component documents ALL states (default, hover, active, focus, disabled, loading, empty, error)
- All values use semantic tokens from `MASTER.md`
- Responsive behavior specified for all three breakpoints (375, 768, 1440)
- Accessibility requirements explicit, not assumed

---

## Token Usage

Tokens live in `design-system/MASTER.md` and map 1:1 to Tailwind v4 `@theme` in `frontend/src/styles/globals.css`.

**Rules:**
- Never use raw hex values (`#3b82f6`) in specs — always token names (`primary`)
- Never use arbitrary pixel values (`437px`) — use the spacing scale from MASTER.md
- Never use arbitrary shadows or z-index — use the elevation/layering scale
- If a design needs a value not in MASTER.md → add the token to MASTER.md first, then reference it
- Color is never the only signal — always pair with an icon or label for status states

---

## Copy and Content

All user-facing text is part of the design spec:

```markdown
## Content
| Element | Copy |
|---|---|
| Headline | "Find your perfect match" |
| Subtitle | "Browse verified profiles with full background checks" |
| CTA button | "Start browsing" |
| Empty state | "No results found. Try adjusting your filters." |
| Error state | "Something went wrong. Please try again." |
| Loading text | — (skeleton only, no text) |
```

**Rules:**
- Spec every piece of user-facing text — headlines, labels, buttons, placeholders, error messages, empty states
- Write real copy, not lorem ipsum — frontend should never have to invent text
- Specify tone consistent with MASTER.md "Domain & Tone" section
- If copy is TBD, mark it explicitly and flag `[NEEDS-DECISION]` — don't leave blanks

---

## Accessibility Patterns

Beyond the MASTER.md baseline (contrast, touch targets, focus rings):

### Color + Icon Pairing
```
✅  ⚠ Warning: unsaved changes     (icon + color + text)
❌  Warning: unsaved changes        (color only — invisible to color blind users)
```

### Focus Order
- Document tab order for complex layouts (modals, forms with multiple sections)
- Trap focus inside modals and drawers
- Return focus to trigger element on close

### Screen Reader Guidance
- `aria-label` on icon-only buttons
- `aria-live="polite"` on toast/notification regions
- `role="status"` on loading indicators
- Meaningful alt text for images (not "image" or filename)

### Motion
- All animations respect `prefers-reduced-motion: reduce`
- No content behind long animations — content loads instantly, animation is decorative
- Default transition: `150ms ease-out` unless component spec overrides

---

## Responsive Design Patterns

Mobile-first always. Design at 375px, then scale up.

### Layout Strategies

| Pattern | 375px | 768px | 1440px |
|---|---|---|---|
| Card grid | 1 column | 2 columns | 3-4 columns |
| Sidebar + content | Stacked (content first) | Side-by-side | Side-by-side with wider content |
| Navigation | Hamburger menu | Horizontal tabs | Full horizontal nav |
| Hero section | Stacked, image below text | Side-by-side | Side-by-side, larger image |
| Form | Full-width inputs | Two-column for related fields | Two-column, max-width container |
| Table | Card list (stacked) | Horizontal scroll | Full table |

### Breakpoint Rules
- Never hide content at mobile — reorganize, don't remove
- Touch targets stay ≥ 44x44px at all breakpoints
- Font sizes scale: `text-2xl` at 375 → `text-4xl` at 768 → `text-5xl` at 1440 (headings)
- Spacing increases with viewport: `p-4` → `p-6` → `p-8` for sections

---

## Handoff Checklist

Before marking a design task as `review`, verify:

- [ ] All tokens reference MASTER.md — zero raw hex/pixel values
- [ ] All interactive components have all states documented
- [ ] All three breakpoints specified (375, 768, 1440)
- [ ] All user-facing copy written (no lorem ipsum, no blanks)
- [ ] Contrast verified: ≥ 4.5:1 normal text, ≥ 3:1 large text/UI
- [ ] Touch targets ≥ 44x44px on all interactive elements
- [ ] Focus ring behavior specified for keyboard navigation
- [ ] Loading, empty, and error states covered
- [ ] New tokens (if any) added to MASTER.md first

---

## What NOT to Do

- No raw hex values in specs — always semantic tokens
- No arbitrary pixel values — use the spacing/sizing scale from MASTER.md
- No lorem ipsum — write real copy or flag `[NEEDS-DECISION]`
- No "make it look nice" instructions — every visual choice is measurable (token, size, weight, contrast)
- No desktop-first designs — always start at 375px
- No missing states — if a component is interactive, all states are documented
- No color-only status signaling — always pair with icon or label
- No specs without responsive behavior — every layout covers 375/768/1440
- No emoji as UI affordances — use Lucide icons only
- No design changes without updating MASTER.md if new tokens are needed
