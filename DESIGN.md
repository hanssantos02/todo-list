---
name: Ledger
description: 'A quiet todo: warm paper, ink, moss, and Spectral editorial headings.'
colors:
  paper: '#f6f1e7'
  sidebar: '#eee8dc'
  surface: '#fffdf8'
  ink: '#1c1814'
  muted: '#625b50'
  rule: '#dcd3c1'
  moss: '#1e4d3f'
  moss-hover: '#14372d'
  on-moss: '#fffdf8'
  selected: '#e0e5d8'
  hover: '#e9e3d7'
  focus: '#41765f'
  high: '#98432d'
  medium: '#80601e'
  low: '#47684e'
  danger: '#a33c29'
  error-bg: '#f5e4d9'
  overlay: '#1c181477'
  dark-paper: '#211f1b'
  dark-sidebar: '#1b1a17'
  dark-surface: '#2a2823'
  dark-ink: '#f3ecdf'
  dark-muted: '#beb6a7'
  dark-rule: '#49443a'
  dark-moss: '#b7d2bb'
  dark-moss-hover: '#d2e4d2'
  dark-on-moss: '#17251d'
  dark-selected: '#323c30'
  dark-hover: '#343127'
  dark-focus: '#b7d2bb'
  dark-high: '#e5a58b'
  dark-medium: '#d5bb77'
  dark-low: '#a7c6a3'
  dark-danger: '#f0ab97'
  dark-error-bg: '#3b2a23'
  dark-overlay: '#090907a8'
typography:
  display:
    fontFamily: '"Spectral", Georgia, serif'
    fontSize: clamp(2.5rem, 3.7vw, 3.5rem)
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.035em
  headline:
    fontFamily: '"Spectral", Georgia, serif'
    fontSize: 1.875rem
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.025em
  dialog-title:
    fontFamily: '"Spectral", Georgia, serif'
    fontSize: 1.75rem
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.025em
  brief-title:
    fontFamily: '"Spectral", Georgia, serif'
    fontSize: 1.5rem
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.025em
  focus-title:
    fontFamily: '"Spectral", Georgia, serif'
    fontSize: clamp(2rem, 4vw, 3.25rem)
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.025em
  brand:
    fontFamily: '"Spectral", Georgia, serif'
    fontSize: 2rem
    lineHeight: 1
    letterSpacing: -0.03em
  body:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  task-title:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.55
  label:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.5
  metadata:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: 6px
  dialog: 14px
spacing:
  space-1: 4px
  space-2: 8px
  space-3: 12px
  space-4: 16px
  space-6: 24px
  space-8: 32px
  space-12: 48px
  space-16: 64px
components:
  button-primary:
    backgroundColor: '{colors.moss}'
    textColor: '{colors.on-moss}'
    typography: '{typography.button}'
    rounded: '{rounded.control}'
    padding: 10px 16px
  button-primary-hover:
    backgroundColor: '{colors.moss-hover}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    typography: '{typography.button}'
    rounded: '{rounded.control}'
    padding: 10px 16px
  button-quiet:
    textColor: '{colors.muted}'
    typography: '{typography.button}'
    rounded: '{rounded.control}'
    padding: 10px 16px
  button-quiet-hover:
    backgroundColor: '{colors.hover}'
    textColor: '{colors.ink}'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.control}'
    padding: 10px 12px
  navigation:
    textColor: '{colors.muted}'
    typography: '{typography.label}'
    rounded: '{rounded.control}'
    padding: 11px 12px
  navigation-current:
    backgroundColor: '{colors.selected}'
    textColor: '{colors.moss}'
  capture:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.control}'
  task-row:
    textColor: '{colors.ink}'
    padding: 16px 0
  priority-high:
    textColor: '{colors.high}'
    typography: '{typography.metadata}'
  dialog:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.dialog}'
    padding: 24px
---

# Design System: Ledger

## Overview

**Creative North Star: "The Working Ledger"**

Ledger extends the user-approved editorial identity: warm paper, quiet ink, moss actions, Spectral headings, thin rules, and native forms. The workspace should feel calm and useful while keeping capture, revision, and completion directly available.

Density comes from a legible ruled list and small supporting metadata, with space around destination headings and focused work. Light and dark themes share semantic roles and the same control grammar. Dark mode uses warm charcoal surfaces, cream text, and pale moss actions rather than treating the light palette as an inversion.

**Key Characteristics:**

- Warm paper and ink, with moss reserved for actions and state.
- Spectral headings paired with a practical system sans.
- Ruled task entries rather than dashboard cards.
- Visible keyboard focus, native dialogs, and touch-sized action controls.
- Quiet color transitions and brief, optional spatial motion.

This record is extracted from `src/styles.css`, `src/template.html`, `src/ui.js`, and `src/app.js`, reconciled with the approved direction in `PRODUCT.md` and the workspace surface brief. It records source behavior; it does not assert visual QA results. There are no shipping raster assets; the interface uses authored inline SVG paths.

## Colors

The palette is warm and low-chroma; semantic names in the frontmatter mirror the CSS custom properties. Unprefixed values are light theme; `dark-` entries record the corresponding values under `:root[data-theme="dark"]`. Components use the unprefixed semantic CSS variables, whose values change with the active theme; the frontmatter's component examples describe light defaults.

### Primary

- **Moss / Pale Moss** (`moss`, `dark-moss`): primary actions, active navigation text, completion marks, links, and selected text background.
- **Deep / Light Moss Hover** (`moss-hover`, `dark-moss-hover`): primary action hover fill.
- **On Moss** (`on-moss`, `dark-on-moss`): paired action and completed-mark foreground.
- **Focus Moss** (`focus`, `dark-focus`): visible keyboard outline.

### Secondary

- **Rust** (`high`, `dark-high`): high priority and overdue text.
- **Ochre** (`medium`, `dark-medium`): medium priority text and its small dot.
- **Leaf** (`low`, `dark-low`): low priority text and local status dot.
- **Danger Rust** (`danger`, `dark-danger`): errors and destructive-action text; error background provides a distinct warning surface.

### Neutral

- **Paper / Warm Charcoal** (`paper`, `dark-paper`): main canvas and ordinary dialog background.
- **Index Paper / Deep Charcoal** (`sidebar`, `dark-sidebar`): persistent index and mobile navigation drawer.
- **Raised Paper / Charcoal Surface** (`surface`, `dark-surface`): fields, capture, and secondary buttons; no shadow implied.
- **Ink / Cream Ink** (`ink`, `dark-ink`): primary content; inverted feedback uses this as its fill with paper text.
- **Quiet Ink** (`muted`, `dark-muted`): metadata, summaries, and resting quiet controls.
- **Fine Rule** (`rule`, `dark-rule`): separators, field strokes, and index boundary.
- **Selected Wash** (`selected`, `dark-selected`): current navigation and chosen day.
- **Hover Wash** (`hover`, `dark-hover`): quiet control hover.
- **Error Paper** (`error-bg`, `dark-error-bg`): storage warning background.
- **Veil** (`overlay`, `dark-overlay`): native dialog backdrop.

### Named Rules

**The The Semantic Pair Rule.** Use the matching on-moss text with moss action fills; theme changes replace both together.

**The The Words Carry State Rule.** Priority and overdue state retain readable words; color and small marks reinforce them.

## Typography

**Display Font:** Spectral, with Georgia and serif fallbacks.

**Body Font:** the platform system sans stack from the frontmatter. There is no separate mono face; keyboard hints use the inherited font.

**Character:** serif headings bring a restrained editorial voice; the sans keeps operational content clear. Spectral is requested at regular, medium, semibold, and regular italic weights with `display=swap`.

### Hierarchy

- **Display:** the fluid frontmatter `display` role for the destination heading; it ranges from 40px to 56px with the default 16px root. There is no separate mobile heading override.
- **Headline:** 30px serif empty-state headings. Ordinary dialog titles use the 28px `dialog-title` role; focused task titles use the fluid `focus-title` role (32–52px).
- **Brief title:** 24px regular italic Spectral. Week date numerals are also 24px Spectral, medium, with line-height 1.3.
- **Brand:** 32px Spectral; the existing small uppercase brand subtitle remains part of the lockup, not a content-label pattern.
- **Body / task title:** 16px system sans; task titles use medium weight and line-height 1.55. Body line-height is 1.5.
- **Label / supporting:** 14px system sans. Task group labels use 14px semibold sans even though their markup is a heading.
- **Metadata:** 12px system sans. Compact control labels use 13px; weekly task counts and established brand/footer details use 11px. These small details are not a new content-heading scale.
- **Notes:** expanded row notes use 14px with line-height 1.7 and 70ch maximum width; Focus notes retain body size, line-height 1.8, and 70ch maximum width. Counts in navigation, dates in the top bar, and week task counts use tabular numerals.

### Named Rules

**The The Editorial Hierarchy Rule.** Use Spectral for destinations, focused task headings, and empty-state headings. Keep task text, navigation, forms, and operational labels in the system sans.

## Layout

The main canvas has a maximum width of 1184px, centered inside the workspace. The recurring space scale is recorded in the frontmatter; fine internal gaps also use 2px, 4px, 6px, and 8px where observed.

- **Below 480px:** capture options and dialog form fields use one column. The base filters use two columns. The page remains usable from a 320px viewport minimum.
- **From 480px:** capture options use three columns, dialog form fields use two, and capture's arrow and search keyboard hint become visible.
- **Below 720px:** the index is a modal drawer; the workspace is one column. Main horizontal inset is 24px, with compact 24px top padding and heading margin. The brief uses 16px vertical padding; the seven-day strip uses 4px vertical padding, 72px day targets, and a 24px bottom margin. Capture has a 16px bottom margin and hides its decorative leading plus. Search takes a full toolbar row; filters and sort sit beneath it. Results line is at least 44px tall. Task actions sit in a second row beneath the task text.
- **From 720px:** a sticky 224px index fills the viewport height. Main padding is 40px 32px 24px, top bar insets are 32px, and task actions occupy the trailing column. Their word labels hide at this intermediate width while SVGs and accessible names remain. Week day targets become 96px tall.
- **From 1100px:** the index widens to 256px; main padding becomes 48px 64px 32px. The top bar uses 48px insets and shows its quiet context line. Task action words return, filters use four fields plus the clear action, and the editor grid uses 1.2fr / 1fr / 1fr.

The top bar has a 76px minimum height. The seven-day strip always uses seven equal `minmax(0, 1fr)` columns, and counts stay on one line. Task rows use a 44px checkbox column, an 8px gap, and a wrapping text column; titles and project names wrap instead of truncating. There is no permanent third workspace column.

## Elevation & Depth

Tonal surfaces and fine rules establish depth in the workspace. Only native dialogs and the floating feedback toast use the shared elevation. Their values differ between themes; the sidecar records both. Backdrops use the matching semantic veil.

### Shadow Vocabulary

- **Protected / feedback elevation:** `0 16px 64px #1c18142b` in light theme; `0 16px 64px #0006` in dark theme. Applied to dialogs and toast, including the mobile drawer through the shared dialog rule.

### Named Rules

**The The Flat Ledger Rule.** Keep the workspace and task rows flat. Reserve the shared elevation for floating dialogs and feedback.

## Shapes

Controls, navigation selections, capture, and feedback use the 6px control radius. Protected dialogs use a 14px radius. The phone drawer is square and edge-attached. Fine 1px borders supply structure. Completion marks are 20px circles inside a 44px action target; priority dots are 5px circles, and project marks are small outlined squares. The SVG icon grammar uses no fill, currentColor strokes at 1.5 units, and round caps and joins on a 24-unit viewBox.

## Components

### Buttons

Compact, clear actions with a 44px minimum height, 14px medium text, 10px 16px padding, and the shared control radius. Primary actions pair moss fill with on-moss text, changing to moss-hover on hover. Secondary actions use surface fill and a fine rule. Quiet actions start in muted ink and gain hover wash plus ink text. Icon buttons provide a 44px square minimum target; small SVGs sit within it. Destructive quiet actions use danger text at rest. The CSS dims disabled buttons to 0.5 opacity and uses a not-allowed cursor. Secondary buttons have no bespoke hover fill; visible focus still applies.

### Inputs / Fields

Native inputs, selects, and textareas use surface fill, a fine rule, 6px corners, 10px 12px padding, 16px text, and a 44px minimum height. Labels are quiet 14px sans. Textareas resize vertically. Invalid fields switch their border to danger, with a separate alert message; color does not replace the message. Search removes the enclosing stroke and background. Keyboard focus uses a 2px focus outline, with a 4px offset on controls and a 1px offset on fields. The caret uses moss.

### Navigation

The persistent index and phone drawer render the same navigation. Rows use 14px sans, a 44px minimum height, 11px 12px padding, an 18px SVG, and counts aligned to the trailing edge. Hover uses the hover wash. The `aria-current="page"` state uses selected wash, moss text, and semibold label weight. Project rows share this state grammar; project names wrap and their counts represent remaining tasks.

### Capture / Containers

Capture is a flat surface with a fine border and 6px corners; focus within changes the border to moss. A title is enough to submit. Details disclose project, due date, priority, and notes without leaving the list. Context appears beneath the capture line. Other ordinary containers use rules and spacing, without card elevation.

### Ruled Task Entry

Rows use 16px vertical padding and a bottom rule. Completion uses a small outlined circle, then moss fill and an inline check SVG; completed text becomes muted and struck through, with a readable Completed status. Metadata retains project, due date, and written priority. Notes, Focus, and Edit remain available without hover. Row action controls stay at least 44px high. Expanded notes occupy the text column and preserve line breaks.

### Weekly Strip / Priority

A week day is a native button with stacked weekday, serif numeral, and unbroken task count. Today uses moss text; an actively chosen day uses selected wash and ink with `aria-pressed`. Priority is text plus a small same-color dot, rather than a badge container.

### Protected Dialogs

Editing, project management, import confirmation, settings, Focus, and mobile navigation use native `<dialog>` and `showModal()`. Ordinary dialogs are at most 580px wide with 24px padding and fit within viewport margins; Focus is at most 760px with 32px padding. A 14px radius and matching veil distinguish focused work. The phone drawer instead fills the viewport height, is square, and is at most 320px wide with a 40px opening to its side. Dialogs support Escape and close controls; app code tracks the opener and restores focus. Editing writes on submission, so Cancel can discard the draft. Focus presents project, task heading, metadata, notes, exit, and complete, without a decorative eyebrow.

### Feedback / Motion

The fixed toast pairs ink background with paper text, floats above the safe-area bottom, wraps its actions, and exposes Undo plus dismissal. Completion confirmation stays quiet and recoverable. The one-snapshot Undo is available until dismissed, reloaded, external change, or the next data mutation.

Buttons and completion marks transition colors in 140ms. Open dialogs arrive in 220ms with the shared easing, moving from 10px below and 0.7 opacity to their resting state. Reduced-motion preference disables dialog arrival and leaves 100ms color feedback. Forced-colors mode adds a Highlight outline to current navigation and completion marks, and uses CanvasText for status and priority dots.

## Do's and Don'ts

### Do:

- **Do** use the same semantic roles and control shapes in light and dark themes.
- **Do** keep task rows ruled, long titles wrapping, and notes readable within 70ch.
- **Do** retain visible Edit, Focus, and notes controls without requiring hover.
- **Do** place small visible marks inside full action targets and keep row action controls at least 44px high.
- **Do** use native dialogs for protected editing, confirmation, navigation on phones, and focused work.
- **Do** remove dialog arrival movement when reduced motion is requested.

### Don't:

- **Don't** replace the approved warm-paper, ink, moss, and Spectral identity with a generic dashboard skin.
- **Don't** communicate priority, completion, or overdue state through color alone.
- **Don't** add elevation to ordinary task rows or turn the list into a wall of cards.
- **Don't** introduce decorative eyebrows to label content that already has a clear heading.
- **Don't** invent tasks, historical completion claims, or progress scores for visual fullness.
