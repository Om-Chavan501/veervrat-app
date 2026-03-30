## Context

The app uses Tailwind CSS 3.4 with a custom color palette (sage, terra, warm, stone) and Inter as the sole font. Dark mode is implemented via the `class` strategy. Animations are defined in `tailwind.config.js` but barely applied. The visual identity problem has three distinct layers: color (dark mode), typography (sentence text), and motion (animations).

## Goals / Non-Goals

**Goals:**
- Night Forest dark palette that preserves earthy identity in dark mode
- Lora serif font applied exclusively to virtue sentence text
- Expressive animation system: list stagger, button press, status pop, card hover, countUp
- Badge semantic colors corrected for dark mode
- All changes contained to the visual layer — zero impact on state, routing, or API

**Non-Goals:**
- Redesigning page layouts or information architecture
- Adding new UI components or pages
- Changing light mode colors (light mode is working well)
- Animating every element — only high-signal moments get animation

## Decisions

### Decision 1: Night Forest as CSS custom properties, not new Tailwind tokens

**Chosen:** Define the dark palette via CSS custom properties on `:root.dark` in `index.css`, and reference them via existing `dark:` Tailwind variants where possible. Only add to `tailwind.config.js` what can't be expressed with existing tokens.

**Rationale:** The dark palette uses hex values that don't map to existing Tailwind color scales. Creating a whole new color scale for dark-only values would pollute the config and require touching every component. CSS vars on `.dark` mean dark mode is controlled in one place.

**Exact palette:**
```
--color-night-bg:      #141410   (page background)
--color-night-surface: #1e1d16   (card surface)
--color-night-raised:  #252419   (elevated card, modals)
--color-night-border:  #38362a   (borders)
--color-night-text:    #e8e4d9   (primary text, warm cream)
--color-night-muted:   #8b8576   (secondary text)
```

**In practice:** `dark:bg-[#141410]` inline where needed, plus CSS class shortcuts `.dark-surface`, `.dark-raised` in `index.css` `@layer components`.

**Alternative considered:** New `night` color scale in tailwind.config — rejected, too many tokens for a single-mode palette.

### Decision 2: Lora via Google Fonts, applied through `font-serif` Tailwind class

**Chosen:** Add `<link>` to Google Fonts (Lora 400/400i/600/700) in `index.html`. The existing `fontFamily.serif` in tailwind.config already maps to Georgia — update it to `['Lora', 'Georgia', 'serif']`. Apply `font-serif` class to sentence text across all surfaces.

**Rationale:** `font-serif` is already in Tailwind config and not used anywhere — it's a free slot. Updating it means zero new class names needed. Lora is available on Google Fonts, has excellent Latin rendering, and has Variable font support for responsive weights.

**Devanagari:** Lora supports Devanagari script. The Marathi (`text_mr`) display will benefit automatically.

**Alternative considered:** Fraunces (more display-oriented) — rejected for body sentence text as it's less readable at conversational sizes. Lora works from 14px up.

### Decision 3: Stagger via Tailwind delay utilities, not a library

**Chosen:** Apply `animate-enter` (new keyframe: opacity 0 + translateY(10px) → full) with `delay-[0ms]`, `delay-[75ms]`, `delay-[150ms]` etc. inline on list items.

**Rationale:** No new dependency. Tailwind's JIT compiles arbitrary delay values. Items cap at 6 in stagger (after that, delay plateaus at 375ms — avoids overlong waits on large lists).

**Alternative considered:** Framer Motion — powerful but adds ~30kb and is architectural overkill for this scope.

### Decision 4: useCountUp as a small inline hook, no library

**Chosen:** Write a `useCountUp(target, duration)` hook in `src/hooks/useCountUp.ts` (~15 lines). Uses `requestAnimationFrame` with easeOut curve.

**Rationale:** Stat counters on Dashboard only. Simple easing loop, no dependency needed.

### Decision 5: Status-change animation via CSS class toggling

**Chosen:** Add a `statusPop` keyframe (`scale(1) → scale(1.3) → scale(1)`, 350ms) to `tailwind.config.js`. Apply `animate-status-pop` programmatically when status changes by toggling a `key` prop on the icon.

**Rationale:** React's key reconciliation triggers remount → animation restart. Clean, no refs needed.

## Risks / Trade-offs

**[Risk] Lora loads from Google Fonts CDN** → Mitigation: Add `display=swap` to prevent FOIT. Fallback Georgia is visually acceptable. Font is small (Latin subset only needed for English; Devanagari subset loads separately).

**[Risk] Inline dark hex values (`dark:bg-[#141410]`) create JIT classes that aren't tree-shakeable if unused** → Low risk — these classes will be used in core layout components. Acceptable.

**[Risk] Stagger delay on large lists feels slow** → Mitigation: Cap stagger at 6 items (450ms max total). Items beyond index 5 get no additional delay.

**[Trade-off] CSS custom properties for dark palette vs Tailwind tokens** → Can't use these values in Tailwind's responsive utilities or `@apply`. Acceptable since dark mode is purely a color concern, not a responsive concern.

## Open Questions

- None. All decisions are made.
