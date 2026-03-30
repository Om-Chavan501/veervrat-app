## 1. Night Forest dark palette

- [x] 1.1 Add Night Forest CSS custom properties to `index.css` under `:root.dark` — `--color-night-bg`, `--color-night-surface`, `--color-night-raised`, `--color-night-border`, `--color-night-text`, `--color-night-muted`
- [x] 1.2 Add `.dark-surface` and `.dark-raised` component shortcuts in `index.css` `@layer components`
- [x] 1.3 Update `body` dark background in `index.css` from `stone.950` to `#141410`
- [x] 1.4 Update `.dark .glass` utility in `index.css` to use `#141410` with warm tint
- [x] 1.5 Update `Card.tsx` dark variants: `dark:bg-[#1e1d16] dark:border-[#38362a]`
- [x] 1.6 Update `Sidebar.tsx` dark variants: bg, border, nav hover, active states to Night Forest
- [x] 1.7 Update `MobileNav.tsx` dark variants: bottom bar, bottom sheet to Night Forest
- [x] 1.8 Update `Badge.tsx` — add dark mode variants for all semantic colors (success/warning/info/danger/muted)

## 2. Typography — Lora serif for virtue sentences

- [x] 2.1 Add Lora Google Font `<link>` to `index.html` (weights 400, 400i, 600, 700; with `display=swap`)
- [x] 2.2 Update `fontFamily.serif` in `tailwind.config.js` to `['Lora', 'Georgia', 'serif']`
- [x] 2.3 Apply `font-serif` + elevated size/leading to sentence text in `JourneyDetail.tsx` header card
- [x] 2.4 Apply `font-serif` to sentence text in `Dashboard.tsx` journey cards
- [x] 2.5 Apply `font-serif` to sentence text in `Journeys.tsx` journey list
- [x] 2.6 Apply `font-serif` to sentence context display in `Clarify.tsx` (n/a — sentence is in hint text after prior refactor)
- [x] 2.7 Apply `font-serif` to sentence display in `AssessmentResults.tsx` suggested sentence cards

## 3. Animation system — config and utilities

- [x] 3.1 Add `enter` keyframe to `tailwind.config.js`: `opacity 0 + translateY(10px) → opacity 1 + translateY(0)`
- [x] 3.2 Add `statusPop` keyframe: `scale(1) → scale(1.3) → scale(0.95) → scale(1)`
- [x] 3.3 Add `animate-enter` and `animate-status-pop` to the `animation` block in `tailwind.config.js`
- [x] 3.4 Update existing `animate-fade-in` duration from 0.25s to 0.35s for expressiveness
- [x] 3.5 Create `src/hooks/useCountUp.ts` — `useCountUp(target, duration)` hook using `requestAnimationFrame` with easeOut

## 4. Micro-interactions — components

- [x] 4.1 Add `active:scale-[0.96] transition-transform` to `Button.tsx` base classes
- [x] 4.2 Add `hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300` to `Card.tsx`
- [x] 4.3 Replace `animate-fade-in` with `animate-enter` on primary page-level wrappers in JourneyDetail, Dashboard, Journeys, Assessments

## 5. List stagger

- [x] 5.1 Apply staggered `animate-enter` with `delay-[0ms]` through `delay-[375ms]` (75ms increments, max 6 items) on journey list items in `Journeys.tsx`
- [x] 5.2 Apply stagger on journey cards in `Dashboard.tsx` active journeys list
- [x] 5.3 Apply stagger on assessment list items in `Assessments.tsx`

## 6. Dashboard stat countUp + status pop

- [x] 6.1 Use `useCountUp` in `Dashboard.tsx` `StatCard` to animate the stat number on mount
- [x] 6.2 In `ActivityList.tsx` (`ExposureList`), add `animate-status-pop` to status icon via key prop change on status update
