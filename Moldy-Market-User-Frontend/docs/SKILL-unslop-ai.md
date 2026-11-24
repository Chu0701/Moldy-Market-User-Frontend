---
name: unslop-ui
description: Build or review frontend interfaces so they look authored, not AI-generated. Use for any landing page, dashboard, web app, component, or mobile UI work, and when the user mentions "AI slop", "looks AI-made", "generic", "vibe-coded", or asks to polish or audit a UI. Combines Anthropic's frontend-aesthetics guidance, Refactoring UI, Vercel Web Interface Guidelines, and Nielsen Norman usability heuristics.
---

# Unslop UI

## Why slop happens
LLMs converge on the statistical center of their training data ("on distribution"). For web UI that center is: Inter, a purple-to-blue gradient, a centered hero, three rounded cards with icons. Slop is not bad craft, it is design with no author. Your job: make deliberate choices, and be able to justify each one with the product's context.

Two rules govern everything below:
1. Decide first, code second. Write the design brief (Step 1) before any markup.
2. Specify with exact tokens, never adjectives. "Modern and clean" produces slop.

---

## Step 1: Design brief (mandatory, 6 lines, before code)
Answer in writing:
- **Purpose**: what problem does this screen solve, for whom?
- **Tone**: pick ONE extreme and commit (editorial, brutalist, retro-futuristic, soft/organic, industrial/utilitarian, luxury/refined, playful, technical/terminal...). Not "modern and clean".
- **Memorable thing**: the one detail a user would remember.
- **Constraints**: framework, accessibility, performance, existing brand or design system (if one exists, follow it and skip aesthetic invention).
- **Primary action** of the screen and what is secondary.
- **Anti-reference**: what generic version of this product must it NOT look like?

If a design system or brand already exists in the repo, its tokens override every aesthetic choice here. This skill then only applies the hierarchy, interaction, and anti-slop checks.

## Step 2: Declare tokens up front
Define as CSS variables (or theme config) BEFORE writing components. Never pick values on the fly.

```css
:root {
  /* color: 1 dominant neutral family, 1 sharp accent, semantic states */
  --bg: ; --surface: ; --text: ; --text-muted: ; --border: ;
  --accent: ; --accent-contrast: ;
  --success: ; --warning: ; --danger: ;
  /* type */
  --font-display: ; --font-body: ; --font-mono: ;
  --step--1: ; --step-0: ; --step-1: ; --step-2: ; --step-3: ; --step-4: ;
  /* space: one base unit (4px or 8px), a fixed scale */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
  /* shape + depth: a scale, not per-component guesses */
  --radius-sm: ; --radius-md: ; --radius-lg: ;
  --shadow-sm: ; --shadow-md: ; --shadow-lg: ;
  /* motion */
  --ease-out: cubic-bezier(.2,.8,.2,1); --dur-fast: 120ms; --dur-base: 220ms;
}
```
Rules:
- Define 8-10 shades per color up front; you need more colors than you think (neutrals, accent, 3 semantic states).
- Prefer HSL or OKLCH over hex so shades can be derived systematically.
- Tint your greys slightly toward the brand hue instead of pure grey.
- Type scale uses a modular ratio (1.125, 1.2, 1.25, 1.333), not the Tailwind default stack of 12/14/16/18/24/30/36/48/60/72 unchanged.

---

## Step 3: Craft rules

### Typography (highest leverage, change this first)
- Pair a distinctive display face with a refined body face. Use weight extremes (e.g. 200 vs 800) and large size jumps (3x+), not timid 400 vs 600.
- Do not default to Inter, Roboto, Arial, Open Sans, Geist, or bare system-ui as the brand voice. They are fine for dense data UI body text if the display face carries the personality.
- Also do not collapse onto the "second default" (Space Grotesk, DM Sans, Plus Jakarta Sans...). Vary the choice per project; if you reached for it automatically, pick something else.
- Vietnamese or other diacritic-heavy content: verify the font has full subset coverage (`latin-ext`, `vietnamese`) before choosing it. Test with real strings.
- Line length 45-75 characters for prose. Line-height inversely proportional to size (tight for big headings, 1.5-1.7 for body).
- Avoid weights under 400 for small UI text. Use tabular numbers (`font-variant-numeric: tabular-nums`) for data.
- Use proper typographic characters: ellipsis `…`, curly quotes, non-breaking spaces between numbers and units.

### Color and theme
- One dominant tone plus one sharp accent beats an evenly distributed rainbow palette.
- Ban: purple-to-blue / violet-to-indigo gradients (`from-purple-600 to-blue-600`), gradient heading text, neon glow on surfaces, white page + violet CTA.
- A gradient must mean something and appear in at most one place. Solid colors are a valid answer.
- Never grey text on a colored background: use a transparent/tinted version of the background color instead.
- Contrast: body text >= 4.5:1, large text and UI components >= 3:1. Do not rely on color alone for state (add icon or text).
- Support light and dark deliberately (`prefers-color-scheme`, `color-scheme`), not by inverting.

### Layout and spacing
- Start with too much whitespace, then remove. Use the spacing scale only; no arbitrary 13px or 27px.
- Group by proximity: space between groups > space within groups. Avoid ambiguous spacing.
- Do not fill the whole screen width. Constrain content to what it needs.
- Break the template: asymmetry, overlap, a grid-breaking element, controlled density. The "centered hero + three equal feature cards + CTA band + footer" skeleton is a slop signal; only use it if the content truly is that shape.
- Do not wrap everything in a card. Use fewer borders: separate with spacing, background shifts, or shadows.
- Uniform corner radius on every element is a tell. Radius should follow a scale tied to element size and the tone of the brief. `rounded-2xl` everywhere is not a decision.

### Hierarchy (Refactoring UI core)
- Not all elements are equal. Decide primary / secondary / tertiary for every screen.
- Do not rely on font size alone: combine size + weight + color (dark & bold = primary, grey & normal = secondary, light grey = tertiary).
- Emphasize by de-emphasizing the surroundings. Labels are a last resort: the data often speaks for itself.
- Buttons follow hierarchy, not just semantics: one primary per view, secondary outlined/ghost, tertiary as link. Destructive is primary-styled only on the confirm step.
- Separate visual hierarchy from document hierarchy (an `h2` can look small).

### Depth, background, and detail
- Create atmosphere with layered backgrounds, texture, grain, geometric pattern, or a contextual effect that fits the tone. Do not default to flat white or a decorative blob.
- Shadow scale defined like the spacing scale. Avoid overly soft, identical shadows on every card.
- Glassmorphism, 3D abstract humans, floating glowing orbs, and emoji used as icons are slop unless the brief demands them.
- Use one coherent icon set at one stroke weight. Do not mix styles. Prefer real product screenshots, real photography, or custom illustration over generic gradient mockups.
- Add accent borders, empty-state design, and custom focus styles as cheap signs of care.

### Motion
- One orchestrated moment beats many scattered micro-animations: e.g. a staggered page-load reveal (`animation-delay`) and meaningful hover/press states.
- Motion must communicate state or spatial origin (anchor transform-origin where the element "comes from"). No decorative fade-in on everything.
- Prefer CSS, then Web Animations API, then a JS library. Animate `transform` and `opacity`, never `all`.
- Always provide a `prefers-reduced-motion` variant.

### Copy and content
- No lorem ipsum, "John Doe", "Acme Inc", "10,000+ happy customers", or invented testimonials. Use realistic, domain-specific content, or clearly marked placeholders.
- Active voice, concise, specific verbs ("Save changes", not "Submit"). Avoid filler hero claims ("Revolutionize your workflow", "Supercharge", "Seamless").
- Avoid the pill badge above the H1 ("New", "Beta", "Now with AI") unless it carries real information.
- Loading states end in an ellipsis and describe the work ("Saving…"). Empty states say what to do next.

---

## Step 4: Interaction, accessibility, and UX (Vercel guidelines + Nielsen heuristics)
Non-negotiable baseline. A pretty UI that fails these is still slop.

**Interaction**
- Everything keyboard-operable; follow WAI-ARIA authoring patterns. Visible focus ring using `:focus-visible`; sticky elements never cover the focused element.
- Hit targets >= 24px (>= 44px on mobile). No dead zones: if it looks clickable, it is.
- Mobile inputs font-size >= 16px (prevents iOS zoom). Never disable zoom. Never block paste.
- Links are real `<a>`; buttons are real `<button>`. No clickable `div`.
- Loading buttons keep their label and show a spinner; if you show a spinner/skeleton, add a short show-delay (~150-300ms) and minimum visible time (~300-500ms) to avoid flicker.
- Destructive actions need confirmation or Undo. Prefer optimistic updates with rollback on failure.
- Persist state in the URL (filters, tabs, pagination). Restore scroll on Back/Forward.
- Set `touch-action: manipulation` on controls; `overscroll-behavior: contain` in modals/drawers.

**Forms**
- Visible labels, correct `type`/`autocomplete`/`inputmode`, errors next to the field with a clear fix, do not disable the submit button without explanation.

**Performance and stability**
- Explicit image dimensions (no layout shift), preload critical fonts, subset fonts, lazy-load below the fold.

**Nielsen heuristics checklist**
1. Visibility of system status  2. Match real world language  3. User control & freedom (undo, cancel)  4. Consistency & standards  5. Error prevention  6. Recognition over recall  7. Flexibility & efficiency (shortcuts)  8. Aesthetic & minimalist design (remove what does not help the task)  9. Help users recover from errors  10. Help & documentation.

**If the UI includes AI/generative features**: show progress and uncertainty, allow stop/regenerate/edit/undo, make output provenance clear, and keep the persona consistent.

---

## Step 5: Slop audit (run before delivering)
Score each tell. 0 = absent, 1 = mild, 2 = notable, 3 = strong. Total >= 12 means redo; fix the highest-scoring tells first.

| # | Tell | Fix |
|---|------|-----|
| 1 | Inter/Roboto/Arial/Geist as the only voice | Distinctive display + body pair |
| 2 | Purple/violet/indigo-to-blue gradient, gradient text | Solid brand color, one restrained gradient max |
| 3 | Centered hero + 3 equal cards + CTA band | Content-driven layout, asymmetry, hierarchy |
| 4 | Same large radius and soft shadow on everything | Radius/shadow scale tied to element role |
| 5 | Emoji or mixed icon styles as icons | One icon set, consistent stroke |
| 6 | Glassmorphism, glow, 3D blobs, floating orbs | Remove unless the brief demands it |
| 7 | Default Tailwind/shadcn look untouched | Customize tokens, spacing, type, states |
| 8 | Pill badge above H1, "Now with AI" | Delete or make it informative |
| 9 | Placeholder or invented copy, fake logos/metrics | Real content or labeled placeholders |
| 10 | Everything fades in on scroll | One orchestrated reveal, rest static |
| 11 | Hierarchy by font size only; all text same grey | Size + weight + color; clear primary action |
| 12 | Arbitrary spacing and font sizes | Tokens only |

Also verify: keyboard pass, focus rings, contrast, reduced motion, mobile width (no horizontal scroll), real-length text (long Vietnamese strings, empty and error states), dark mode if supported.

Do not waste effort on harmless memes: a single standard sans for dense table body text, or a card used where content is genuinely a discrete object, are not slop.

## Delivery format
1. Output the 6-line brief.
2. Output the code, working and complete, with tokens declared at the top.
3. Output a short audit: the tells checked, the choices made and why (one line each), and anything deliberately left default.

## Sources this skill distills
- Anthropic, "Prompting for frontend aesthetics" (Claude Cookbook): https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics
- Anthropic, "Improving frontend design through Skills": https://claude.com/resources/articles/improving-frontend-design-through-skills
- Anthropic official skill `frontend-design`: https://github.com/anthropics/skills
- Wathan & Schoger, Refactoring UI: https://refactoringui.com
- Vercel, Web Interface Guidelines: https://vercel.com/design/guidelines
- Nielsen Norman Group, 10 Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- Weisz et al., six principles for designing generative AI applications: https://www.arxiv.org/pdf/2401.14484
- Kosta Canatselis, "Spot the Slop": https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c
- Community catalogs of slop tells (Impeccable anti-patterns, ux-skill wiki): https://www.mintlify.com/pbakaus/impeccable/concepts/anti-patterns
