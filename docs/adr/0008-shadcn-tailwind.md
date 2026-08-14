# shadcn/ui + Tailwind for the SPA shell

The Next.js SPA uses Tailwind CSS and shadcn/ui (zinc base, CSS variables, light mode first) for layout and product UI. Auth forms use react-hook-form + Zod + shadcn Form; that Zod is client-form validation only, not the OpenAPI contract.

**Considered options:** unstyled HTML until later; dark-mode-first; generate Zod from OpenAPI for forms.

**Why:** Gives a consistent, accessible component kit without a second design system, while keeping API types owned by Orval (ADR 0007).
