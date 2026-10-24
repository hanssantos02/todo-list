# Ledger 2.0 engineering handoff

## A. Product summary

Ledger now supports a complete daily planning loop: capture a thought, see due and overdue work across projects, revise it without recreating it, focus on one task, and recover a recent change. Its warm editorial identity remains intact in responsive light and dark workspaces. The vanilla JavaScript/Webpack stack remains in place.

## B. Implemented features

All agreed P0/P1 features are implemented: title-first capture with optional details, complete atomic task editing and stable project moves, Today/Upcoming/All Tasks/Completed views, title-and-notes search, combined filters, four sorting modes, project create/rename/delete with counts, protected project deletion, one-step Undo, persistent Light/Dark/System themes, guarded keyboard shortcuts, validated JSON backup/restore, and actual-data completion summaries.

The three selected differentiators are implemented: Daily Brief, a next-seven-days workload strip with date selection, and single-task Focus Mode. Undated tasks remain available in All Tasks and their projects. Completed tasks can be reopened.

Deferred: subtasks, recurrence, drag ordering, reminders, PWA installation, timers, cloud sync, and historical analytics. No partial or placeholder controls for these features ship.

## C. UI/UX decisions

A persistent project index supports desktop/tablet; phone navigation becomes a native modal drawer. A serif destination heading leads into useful daily context and a title-first capture above ruled task rows. Search and optional filters narrow results without replacing the input or caret. Full editing uses a protected draft in a native dialog; Cancel has no mutation side effects. Status and priority always include words.

The color system uses semantic CSS properties for paper, ink, moss actions, interaction states, priority, and warnings. Dark mode uses warm charcoal and ivory rather than inversion. Focus rings, selection, carets, scrollbars, tabular counts, and reduced motion are themed. Phone spacing was tightened after review so actual work appears in the opening viewport.

## D. Architecture and data integrity

`todo.js` and `project.js` retain domain responsibilities. `views.js` derives calendar/search/filter/sort rows from project-owned todos. `store.js` owns the single canonical state, guarded mutation, save rollback, and one-snapshot Undo. `storage.js` normalizes legacy data and validates backup payloads. `app.js` orchestrates stable forms, focus, events, dialogs, preferences, and error feedback; `ui.js` safely renders DOM text and authored SVG icons. `index.js` only boots the app and styles.

The existing `todo-projects` array and stable IDs remain compatible. New task creation metadata is additive; legacy history is not fabricated. Corrupt data remains recoverable, with automatic writes blocked and original-byte download where readable. Mutations fail atomically when storage cannot save, preserving the draft and preceding committed state. Another tab's task-storage write blocks stale writes until reload. Imports are fully validated before confirmed replacement.

Undo persists for one successful data mutation until the next successful mutation, dismissal, or reload. Failed writes keep their previous recovery opportunity. Normal imports can be undone; recovery imports cannot reconstruct an unreadable original, which should be downloaded first.

## E. Validation

A clean `npm ci` succeeded. All 43 Node/jsdom tests passed, including the 600-task/30-project stress fixture and rapid submission guard. The alternate-timezone domain/storage/store suite passed all 26 tests. Production build succeeded without warnings at 56.1 KiB for main.js. npm audit reported zero vulnerabilities. Whitespace validation passed.

Real in-app browser checks covered capture, full editing/moves/cancel, project creation, smart views, Focus, completion/Undo, native keyboard shortcuts and focus restoration, themes, real export/import/reload, mobile navigation/dialogs, and empty/populated states. Layouts were inspected around 375, 768, 1089, and 1440px in both themes where relevant. Independent code review retained four P2 findings; all were fixed and verified. The finish reviewer scored both material design fixes resolved (`ship`, targeted verdict).

Known limits: no real-device, screen-reader, Safari/Firefox, or exhaustive WCAG conformance test. Native dialog behavior is emulated in jsdom and separately checked in the in-app browser. Full-page screenshot capture was unreliable, so validated viewport captures supplied the evidence. See browser-verification.md for precise coverage.

Preserved invalid legacy due-date text is displayed as undated; strict import rejects that invalid date even in an exported backup until it is corrected. No cloud sync, encrypted storage, live cross-tab merge, or virtualized task list is provided. Browser site-data clearing still requires an exported backup. Unsaved form drafts do not survive refresh and are not included in exports.

## F. Future roadmap

Prioritize real iOS/Android and assistive-technology testing, then self-host Spectral for reliable first-load font delivery. If real usage justifies them, evaluate small subtasks and a carefully specified recurrence model separately. Add virtualization only when measured ledger size calls for it; avoid adding a backend without a clear user need.

## G. Engineering learnings

An empty parse result must never stand in for an unreadable local database: startup defaults can otherwise overwrite recoverable data. A delayed local file read needs a UI-session boundary, because its callback can outlive Settings and erase a later draft by opening a different dialog. Destination constraints and user filters must intersect rather than overwrite each other. Automatic calendar defaults require day rollover handling independent of explicitly selected dates.

These lessons are already encoded in implementation, regression tests, the audit, and README. The `ce-compound` durable-learning test did not justify a duplicate solutions document.

## Delivery state

Development was performed on `codex/ledger-2`. Start the local preview with `npm start`. QA entries were removed and the originally empty Default project ID and System theme restored. Publishing is controlled separately from the build.
