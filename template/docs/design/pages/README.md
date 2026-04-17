---
title: Page-specific design overrides
kind: index
---

# Page-specific design overrides

This folder holds **narrow deltas** from the global design system for individual pages or flows. Use it only when a page legitimately deviates — hero landing, onboarding, marketing route — and the deviation can't be absorbed by an existing token or component.

## Rules

1. **The master wins.** Don't redefine tokens here; reference them. If a page needs a new token, add it to `../system.md` first.
2. **One file per page or flow.** Filename: `<route-or-slug>.md` (e.g. `landing.md`, `onboarding.md`, `checkout.md`).
3. **Frontmatter required:**

   ```yaml
   ---
   title: <Page> Design Overrides
   based-on: [docs/design/system.md]
   page: /<route>
   ---
   ```

4. **Keep it short.** If an override grows beyond ~100 lines, it's probably a pattern that belongs in the master or deserves its own component. Promote it.

## Template

```markdown
---
title: Landing page — design overrides
based-on: [docs/design/system.md]
page: /
---

# Landing page — design overrides

## Hero
- Type scale: `display` + 1.2× line-height (vs. master default)
- Vertical rhythm: `py-24` (vs. master `py-16`)

## Exceptions
- _List every exception with a one-line justification. If you can't justify it, it shouldn't exist._
```

## Current overrides

- _none yet_
