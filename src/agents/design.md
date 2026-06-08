# Design Agent — Visual System / Turizoneando 2026
> Read AGENTS.md first. This file complements it.
> Use this context for all UI tasks: components, tokens, layout, animations.

---

## Core principle: Mobile First

This app is used by people walking through the Colonial Zone holding their phone with one hand.
Every design decision starts from that context. Desktop is an afterthought — the admin panel
is the only section where desktop layout matters.

**Design in this order every time:**
1. 375px portrait (iPhone SE — the minimum)
2. 390px portrait (iPhone 14 — the primary target)
3. 430px portrait (larger Androids)
4. Tablet / desktop only if explicitly asked

Never design from desktop and scale down.

---

## Mobile constraints that drive every layout decision

```
One-hand use:     primary actions must be in the bottom 60% of the screen
Thumb zone:       critical taps → y > 50% of screen height
Top zone:         titles and status only — never primary CTAs
Safe areas:       account for notch (top) and home indicator (bottom)
Input zoom:       all inputs use font-size ≥ 16px (prevents iOS auto-zoom)
Viewport height:  use dvh, not vh (handles mobile browser chrome correctly)
Touch targets:    minimum 44×44px — prefer 48×48px
Tap feedback:     every tappable element has immediate visual feedback
No hover:         hover states are decorative only — never the only interaction cue
Orientation:      portrait only (lock orientation in the app)
```

---

## Layout system

```css
/* Viewport — always use dvh, never vh */
--screen-height: 100dvh;
--screen-width:  100dvw;

/* Safe area insets (notch + home indicator) */
--safe-top:    env(safe-area-inset-top, 0px);
--safe-bottom: env(safe-area-inset-bottom, 0px);
--safe-left:   env(safe-area-inset-left, 0px);
--safe-right:  env(safe-area-inset-right, 0px);

/* Page layout (every page uses this base) */
--page-padding-x: 16px;
--page-padding-top:    calc(var(--safe-top) + 16px);
--page-padding-bottom: calc(var(--safe-bottom) + 80px); /* 80px = bottom nav */

/* Bottom navigation bar */
--bottom-nav-height: calc(56px + var(--safe-bottom));

/* Content max-width (centered on tablet+) */
--content-max: 480px;
```

---

## Color tokens

```css
/* ── Brand primaries ─────────────────────────────── */
--color-navy:        #1B2B6E;
--color-yellow:      #F5C800;
--color-red:         #E63329;
--color-teal:        #2BBFB8;

/* ── Brand secondaries ───────────────────────────── */
--color-orange:      #F4762B;
--color-green:       #3CAD42;

/* ── Neutrals ────────────────────────────────────── */
--color-white:       #FFFFFF;
--color-black:       #1A1A1A;
--color-gray-light:  #F4F5F7;
--color-gray-mid:    #A0A8B8;
--color-gray-dark:   #3A3F5C;

/* ── Semantic ────────────────────────────────────── */
--color-bg:          #F4F5F7;
--color-surface:     #FFFFFF;
--color-text:        #1A1A1A;
--color-text-muted:  #3A3F5C;
--color-border:      #DDE1EE;
--color-success:     #3CAD42;
--color-error:       #E63329;
--color-warning:     #F4762B;

/* ── Stage colors ────────────────────────────────── */
--color-stage-1:     #2BBFB8;   /* teal   — basic prizes */
--color-stage-2:     #F4762B;   /* orange — intermediate prizes */
--color-stage-3:     #F5C800;   /* yellow — major prizes */
```

---

## Typography

```css
--font-display: 'Fredoka One', cursive;   /* headings, titles, score */
--font-body:    'Nunito', sans-serif;     /* body, UI labels, inputs */

/* Mobile type scale — minimum 16px for body to prevent iOS zoom */
--text-xs:   12px;
--text-sm:   14px;
--text-base: 16px;   /* ← minimum for inputs */
--text-lg:   18px;
--text-xl:   22px;
--text-2xl:  28px;
--text-3xl:  36px;
```

---

## Spacing & shape

```css
--space-1: 4px;  --space-2: 8px;   --space-3: 12px;
--space-4: 16px; --space-6: 24px;  --space-8: 32px;
--space-12: 48px; --space-16: 64px;

--radius-sm:   8px;
--radius-md:   12px;
--radius-lg:   20px;
--radius-full: 9999px;

--shadow-card: 0 4px 16px rgba(27, 43, 110, 0.12);
--shadow-pop:  0 8px 32px rgba(27, 43, 110, 0.20);
```

---

## Mobile UI patterns (required — not optional)

### Bottom navigation
All main sections use a fixed bottom nav bar, never a top hamburger menu.
Primary actions (scan QR, view map) live in the bottom nav.
Height: `var(--bottom-nav-height)` — always accounts for the home indicator safe area.

### Bottom sheets
Overlays, modals, and panel content slide up from the bottom — never appear as centered modals.
Full-screen bottom sheets: `height: calc(100dvh - var(--safe-top) - 20px)`.
Partial bottom sheets: `max-height: 75dvh`, with a drag handle at the top.
Always include a close/dismiss gesture (swipe down).

### Full-screen pages for immersive flows
QR scanner → full screen, no nav bar visible.
Narration player → full screen with centered audio controls.
Prize wheel → full screen animation.
These pages use `position: fixed; inset: 0` and show no bottom nav.

### Primary action buttons
Always full-width (`width: 100%`) on mobile.
Height: minimum 52px.
Placed at the bottom of the screen content (above the bottom nav area).
The single most important action on any screen must be reachable with the right thumb.

### Touch feedback
Every tappable element must have:
- `active` state with `transform: scale(0.97)` or background change
- `transition: 150ms ease`
No element should feel "dead" when tapped.

---

## Component catalog (check before creating anything new)

| Component | Mobile behavior | Description |
|---|---|---|
| `<MapBoard />` | Full screen, pinch-to-zoom | Interactive stop map |
| `<MapStop />` | 48×48px tap target minimum | Individual stop node |
| `<StageIndicator />` | Fixed top bar | Stage 1/2/3 progress |
| `<QRScanner />` | Full screen camera | QR scanning view |
| `<NarrationPlayer />` | Full screen, large controls | Audio with skip-after-5s |
| `<QuestionCard />` | Full screen bottom sheet | Question with 4 options |
| `<AnswerOption />` | Full width, 56px height | One answer option |
| `<PrizeWheel />` | Full screen | Animated prize wheel |
| `<PrizeCode />` | Full screen celebration | Prize won screen |
| `<ScoreBoard />` | Compact, top area | Score + stops remaining |
| `<MascotBubble />` | Bottom-anchored | Mascot tip/feedback bubble |
| `<BottomSheet />` | Slide-up overlay | Base for all overlays |
| `<BottomNav />` | Fixed bottom | Main navigation |

**Before creating a new component, verify it doesn't exist here. Add it when created.**

---

## Map stop states

```
locked     → gray (#A0A8B8) + lock icon — not tappable
active     → --color-yellow + pulse ring — tappable
completed  → --color-green + checkmark — tappable (review mode)
current    → --color-teal + glow — tappable
```

---

## Animation rules

- Stop unlocked: **bounce** — scale 1→1.15→1, 300ms ease-out.
- QR success: **green flash overlay** + checkmark, 400ms.
- Prize wheel: minimum **3 seconds** spin, decelerate into winning segment.
- Answer correct: **confetti burst** (CSS, 12 particles), color `--color-yellow`.
- Answer wrong: **shake** — translateX ±6px × 3, 300ms, `--color-red` border flash.
- Loading: **mascot bounce** — the mascot head icon pulses, not a spinner.
- Bottom sheet open: `translateY(100%) → translateY(0)`, 300ms cubic-bezier(0.32, 0.72, 0, 1).
- Page enter: `translateY(20px) opacity(0) → translateY(0) opacity(1)`, 250ms ease-out.
- All animations respect `prefers-reduced-motion` — wrap in media query.

---

## Performance rules (critical for mobile on colonial zone WiFi/4G)

- Images: WebP format, max 200KB per stop image.
- Narration audio: pre-loaded after QR validation — not on page load.
- Map: lazy-load stop details — render markers first, content on tap.
- No animation libraries over 50KB — CSS animations preferred.
- Google Fonts loaded with `display=swap` and `preconnect`.
- No layout shifts (CLS): reserve space for images with fixed aspect ratios.

---

## Accessibility minimums

- All interactive elements have `aria-label`.
- Color is never the only state indicator — always pair with icon or text label.
- Minimum contrast 4.5:1 (text) and 3:1 (UI components).
- Touch targets minimum 44×44px — prefer 48×48px.
- All inputs `font-size: 16px` minimum (prevents iOS zoom).

---

## Mascot usage rules

- Appears in: loading screens, empty states, victory screens, error states.
- Use `<MascotBubble message="..." mood="happy|thinking|excited|sad" />`.
- Never distort or recolor the mascot asset.
- Always on a light background — never directly on dark surfaces.

---

## Admin panel exception

The admin panel (`/admin/*`) is the only section designed for desktop first.
MITUR staff validate prizes at a desk or with a tablet, not walking around.
Admin components do not need to follow the mobile-first rules above.
Admin uses the same color tokens but a standard sidebar layout.

---

## Rules for this agent

1. Start every layout at 375px. Expand up — never shrink down.
2. Primary actions always in the bottom 60% of the screen.
3. Use `dvh` not `vh`. Use `env(safe-area-inset-*)` for edge spacing.
4. All inputs `font-size: 16px` minimum — no exceptions.
5. Touch targets minimum 44×44px — always verify.
6. No hover-only interactions.
7. All colors reference CSS variables — no hardcoded hex in component code.
8. Add new components to the catalog before closing the task.
9. When changing a token, update this file first, then the code.

---

## Definition of done (design)

- [ ] Designed and tested at 375px width first
- [ ] Primary actions reachable in the bottom 60% of screen
- [ ] `dvh` used instead of `vh`
- [ ] Safe area insets applied to edges touching screen boundary
- [ ] All inputs have `font-size: 16px` minimum
- [ ] Touch targets ≥ 44×44px verified
- [ ] CSS token variables used — no hardcoded hex
- [ ] Component added to catalog if new
- [ ] Animations follow rules (no custom spinners)
- [ ] This .md updated if catalog or tokens changed
