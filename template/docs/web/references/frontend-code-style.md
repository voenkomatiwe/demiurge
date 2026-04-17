---
title: Frontend Code Style
kind: agent-reference
audience: [role:frontend]
---

# Frontend Code Style

Reference for the frontend agent. Patterns and conventions for React + TypeScript + Tailwind v4.

---

## Folder Structure

```
src/
├── components/        # Shared UI components
│   ├── ui/            # shadcn/ui primitives (auto-generated)
│   └── {Feature}/     # Composed components grouped by feature
├── pages/             # Route-level components
├── content/           # Static content (copy, strings)
├── hooks/             # Shared custom hooks
├── lib/               # Utilities (format, validation)
├── styles/            # globals.css with @theme tokens
└── features/          # Self-contained feature modules (when needed)
    └── {feature}/
        ├── components/
        ├── hooks/
        └── lib/
```

For a simple landing page, `features/` may not be needed — flat `components/` is fine.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component files | PascalCase | `DogCard.tsx` |
| Utility files | kebab-case | `format-weight.ts` |
| Components | PascalCase | `DogCard` |
| Hooks | camelCase with `use` prefix | `useDogs`, `useAdoptionForm` |
| Type aliases | PascalCase | `DogBreed`, `CatProfile` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PETS_PER_OWNER` |
| Zod schemas | PascalCase + Schema | `AdoptionFormSchema` |

---

## Component Pattern

```typescript
type DogCardProps = {
  dog: Dog;
  onAdopt: (dog: Dog) => void;
};

export function DogCard({ dog, onAdopt }: DogCardProps) {
  const isAvailable = dog.status === "available";

  return (
    <Card className={cn("rounded-xl border", isAvailable && "border-primary")}>
      <CardHeader>
        <CardTitle>{dog.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{dog.breed}</p>
        <Button onClick={() => onAdopt(dog)} disabled={!isAvailable}>
          Adopt
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Rules:**
- Props type defined above the component, named `{ComponentName}Props`
- Named exports only (no `export default`)
- Derived values as `const` before `return`
- Tailwind only — no inline `style`, no CSS modules
- `cn()` for conditional classes

---

## Page Component Pattern

Pages are entry points that compose section components:

```typescript
export function CatAdoptionPage() {
  const [selectedBreed, setSelectedBreed] = useState<string | null>(null);

  return (
    <main className="flex flex-col">
      <HeroSection />
      <BreedFilter selected={selectedBreed} onSelect={setSelectedBreed} />
      <CatGallery breed={selectedBreed} />
      <AdoptionForm />
      <Footer />
    </main>
  );
}
```

Pages handle layout composition and top-level state. Presentational components handle rendering.

---

## Content Pattern (static pages)

For landing pages and static content, centralize all copy:

```typescript
// src/content/landing.ts
export const landingContent = {
  hero: {
    headline: "Find Your Perfect Pet",
    subtitle: "Cats, dogs, and everything in between",
    cta: "Browse Pets",
  },
  features: [
    { title: "Verified Shelters", description: "Every shelter is checked" },
    { title: "Health Records", description: "Full medical history included" },
  ],
  footer: {
    copyright: "© 2026 CatsAndDogs",
    links: [{ label: "Privacy", href: "#" }],
  },
} as const;
```

**Rule:** JSX must NOT contain hard-coded user-facing strings. Everything comes from a content file.

---

## Form Pattern (client-only)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const AdoptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  petType: z.enum(["cat", "dog"]),
});

type AdoptionForm = z.infer<typeof AdoptionSchema>;

export function AdoptionForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<AdoptionForm>({
    resolver: zodResolver(AdoptionSchema),
  });

  function onSubmit(data: AdoptionForm) {
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="text-center text-lg">Thanks! We'll be in touch.</p>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* fields */}
    </form>
  );
}
```

---

## Tailwind Patterns

```tsx
// Semantic tokens only — never arbitrary values
<div className="bg-primary text-primary-foreground" />

// Conditional classes
<div className={cn("rounded-xl border", isActive && "border-primary")} />

// Layout
<div className="flex flex-col gap-4 p-6" />           // section container
<ul className="grid grid-cols-1 gap-4 md:grid-cols-3" /> // responsive grid

// Mobile-first responsive
<h1 className="text-2xl font-bold md:text-4xl lg:text-5xl" />
```

---

## Loading / Empty States

```tsx
if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

if (!items.length) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="text-lg font-medium">No pets found</p>
      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
    </div>
  );
}
```

---

## When Backend Exists

These patterns apply only when the project has API endpoints:

**Query hooks** (`queries.ts` per feature):
```typescript
export const petKeys = {
  list: (filters?: PetFilters) => ["pets", filters] as const,
  detail: (id: string) => ["pets", id] as const,
};

export function usePets(filters?: PetFilters) {
  return useQuery({
    queryKey: petKeys.list(filters),
    queryFn: () => api.get("pets", { searchParams: filters }).json<Pet[]>(),
  });
}
```

**Zustand** (global state only — auth token, selected entity):
```typescript
const token = useAppStore((s) => s.token);
```

**Rule:** All server state in React Query. Only auth/session in Zustand.

---

## What NOT to Do

- No `export default` for components (only for page route wrappers if needed)
- No CSS files, no `style={{}}` props
- No `any` — use `unknown` + type guards or Zod
- No `useEffect` for data fetching — use React Query when backend exists
- No prop drilling more than 2 levels — lift state or use composition
- No helper functions inside JSX `return` — define before `return`
- No comments that describe what the code does — only non-obvious intent
- No arbitrary Tailwind values (`bg-[#hex]`, `w-[437px]`) — add tokens to `@theme` first

---

## Routing

File structure mirrors the URL hierarchy:

```
src/pages/
├── HomePage.tsx            # /
├── DashboardPage.tsx       # /dashboard
├── settings/
│   ├── SettingsPage.tsx    # /settings
│   └── ProfilePage.tsx     # /settings/profile
└── NotFoundPage.tsx        # fallback 404
```

**Rules:**
- One page file = one route. File name: `{Name}Page.tsx`
- Nested routes = nested folders inside `pages/`
- Layout wrappers live in `components/layouts/` — `AppLayout.tsx`, `AuthLayout.tsx`
- Protected routes via a `<RequireAuth>` wrapper component, not inline auth logic inside pages
- Lazy loading via `React.lazy()` for pages outside the initial bundle (dashboard, settings)

---

## Error Handling

Three-tier strategy:

1. **App-level Error Boundary** — catches all unhandled errors, shows a fallback "something went wrong" screen with a retry button
2. **Feature-level Error Boundary** — wraps each independent block (cards, tables, forms) so a crash in one block doesn't take down the whole page
3. **Component-level** — inline handling via React Query `isError` / form validation errors

Error boundary fallback pattern:

```tsx
function FeatureErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <p className="text-sm text-destructive">{error.message}</p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        Retry
      </Button>
    </div>
  );
}
```

- Toast notifications via shadcn/ui `sonner` for mutations (success/error)
- Form validation errors stay inline — never in toasts

---

## State Management

Three types of state, three tools. Never mix.

| Type | Tool | Example |
|---|---|---|
| Server state | React Query | Product list, user profile |
| Global client state | Zustand | Auth token, theme, sidebar open/closed |
| Local UI state | useState / useReducer | Dropdown open, input value |

**Rules:**
- Data from the server → React Query. Never duplicate server data in Zustand
- One Zustand store per file: `stores/{name}.ts`. Only for state needed by ≥2 unrelated components
- Atomic selectors always: `useAppStore((s) => s.theme)`, never `useAppStore()` wholesale (causes unnecessary re-renders)
- Prop drilling up to 2 levels is fine — don't reach for a store prematurely
- `useReducer` over `useState` when ≥3 related variables change together (wizard steps, multi-field form without react-hook-form)

---

## Feature Modules

When a feature grows beyond 3-4 files, extract to `features/{feature}/`:

```
src/features/
└── adoption/
    ├── components/
    │   ├── AdoptionForm.tsx
    │   └── AdoptionCard.tsx
    ├── hooks/
    │   └── useAdoption.ts
    ├── lib/
    │   └── adoption-utils.ts
    ├── queries.ts          # React Query keys + hooks
    └── index.ts            # public API — re-exports only
```

**Rules:**
- External code imports ONLY through `index.ts` (`@/features/adoption`), never directly into internal files
- Components inside a feature can import each other freely
- A feature NEVER imports from another feature directly. Shared code goes to top-level `components/` or `hooks/`
- When a feature is small (1-2 components) — keep it in `components/`, don't create a feature folder prematurely
- `queries.ts` is the single source for React Query keys and hooks for that feature. Key factory pattern as shown in "When Backend Exists"

---

## Testing

Tools: Vitest + React Testing Library.

**What to test:**
- Business logic in `lib/` — unit tests, 100% coverage on utilities
- Custom hooks — via `renderHook()` from `@testing-library/react`
- Components with logic — interactivity, conditional rendering, form submission
- Integration: full page with mocked API (msw)

**What NOT to test:**
- Pure layout without logic (a static Card with text)
- shadcn/ui primitives (Button, Input) — already tested upstream
- Tailwind classes and styles

Test pattern:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdoptionCard } from "./AdoptionCard";

test("calls onAdopt when adopt button is clicked", async () => {
  const onAdopt = vi.fn();
  render(<AdoptionCard dog={mockDog} onAdopt={onAdopt} />);

  await userEvent.click(screen.getByRole("button", { name: /adopt/i }));

  expect(onAdopt).toHaveBeenCalledWith(mockDog);
});
```

**File structure:**
- Tests colocated with source: `AdoptionCard.tsx` → `AdoptionCard.test.tsx`
- Shared test utilities in `src/test/` (providers, mocks, factories)
- MSW handlers in `src/test/handlers/`
