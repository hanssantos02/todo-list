# Ledger 1.0 audit

Evidence: all nine source/config files and README inspected; existing empty application observed in the in-app browser at its supplied 1089px viewport on 2026-10-24. Populated/mobile behavior was not visually inspected before implementation.

| Finding | Impact | Severity | Improvement and benefit | Risk |
|---|---|---|---|---|
| storage.js returns [] for malformed JSON; index.js immediately seeds and saves when empty | Can overwrite recoverable user data | P0 | Distinguish missing, invalid, and unavailable storage; preserve raw input and block unsafe writes | Migration requires regression tests |
| getItem is outside storage.js try block | Storage denial can prevent startup | P1 | Catch reads; explain temporary/unavailable persistence | Low |
| ui.js editor changes priority only | Users must recreate tasks to fix title, date, or notes | P1 | Atomic full-field editor with project moves | Identity and cancellation need tests |
| index.js redraw replaces navigation and task controls after actions | Keyboard focus can be lost | P1 | Restore semantic focus anchors; native dialogs restore trigger focus | Must verify deleted/filtered targets |
| template.html always displays four capture fields below tasks | Empty view's large form dominates; longer lists hide capture | P2 | Title-first capture above results with optional details | Preserve drafts during errors |
| Project deletion uses a three-second armed second click | Consequences and recovery are unclear | P1 | Explicit project confirmation with task count and real Undo | Final-project fallback must reverse correctly |
| No derived views or cross-project search | Difficult to find urgent work across projects | P1 | Smart views, combined filters, deterministic sorting | Dates must use local calendar days |
| Existing cream/ink/moss/Spectral language is coherent | Strong product identity worth preserving | Positive | Extend existing palette with intentional dark theme and ruled list density | Avoid generic dashboard cards |
| Titles/descriptions use textContent in ui.js | Good untrusted-text baseline | Positive | Keep safe text APIs for imported content | Validate structure before rendering |
| No tests or test scripts | Important changes lack regression evidence | P1 | Node domain/storage tests and jsdom workflow tests; real browser checks separately | Native dialog emulation is limited |

## Product decisions
The brief already specifies P0/P1; broad ideation/brainstorming would repeat settled requirements. Evaluated the optional features against value, model impact, and maintenance: Daily Brief and the weekly strip derive existing dates at low persistence risk; Focus Mode reuses one existing task. Subtasks and recurrence add new completion semantics and migration risk; defer them alongside reminders, drag-and-drop, history charts, and PWA work. No fabricated completion history.

## Technical quality baseline
Semantic buttons and labels, text-safe rendering, and local date-fns parsing were good starting points. Full-screen-reader, contrast, mobile, and performance scores are intentionally withheld until the finished application is inspected; source inspection alone does not prove WCAG conformance.
