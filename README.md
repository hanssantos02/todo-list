# Ledger — a quiet todo

A calm, local-first workspace for tasks and projects. Ledger pairs warm paper, serif headings, moss-green actions, and ruled entries with fast capture and practical daily planning. No account or backend is required.

## What works

- **Quick capture:** a title is enough. Today assigns today's local date; the visible capture hint shows the destination project and date. Details exposes notes, project, date, and priority. Other views default to no date.
- **Complete editing:** change the title, notes, due date, priority, and project. Save applies the whole edit; Cancel leaves the task unchanged. Moves preserve the task ID and a single project owner.
- **Smart views:** Today separates overdue and due-today work; Upcoming shows future open tasks; All Tasks includes open, completed, and undated tasks; Completed lets you reopen finished work. Projects retain ownership in every view.
- **Find and organize:** search titles and notes, combine project/priority/state/date filters, clear filters, and sort by due date, priority, title, or entry order. Filters narrow the current destination.
- **Projects:** create, rename, switch, and delete projects. Counts show remaining tasks. Deletion explains its effect and can be undone. Deleting the last project creates a usable Default project.
- **Recovery:** one-step Undo covers the latest successful data change, including task completion/deletion, edits, project changes, and a normal backup replacement. It lasts until another successful change, dismissal, or reload. There is no countdown. Failed changes do not consume the preceding Undo.
- **Appearance:** designed Light, Dark, and System themes; the preference is stored locally and applied before the workspace paints.
- **Daily review:** a Daily Brief reports actual due/overdue/current completed counts. A seven-day strip selects open work due on a date. Focus Mode shows one task and its notes with a completion action.
- **Backups:** export JSON, validate an import, inspect its task/project counts, then confirm replacement. Invalid files never replace the ledger.

## Run locally

Use a current Node.js LTS release supporting the built-in test runner (Node 22.22.2+ or 24.15+; verified with Node 24.21.0).

```sh
npm ci
npm start
```

The development server opens on [localhost:8080](http://localhost:8080) and binds to the local machine. To run without opening a browser:

```sh
npm start -- --no-open
```

```sh
npm test             # Node domain/storage/store and jsdom application tests
npm run test:tz      # Calendar/domain/storage tests in America/Los_Angeles
npm run build        # Optimized production files in dist/
```

Serve `dist/` using any static web server. The application does not require a server API. `npm run deploy` is a manual legacy GitHub Pages publishing command; local builds do not deploy anything.

## Keyboard and accessibility

| Shortcut | Action |
|---|---|
| `N` | Focus quick capture |
| `/` | Focus task search |
| `Escape` | Close the current dialog and discard its unsaved draft |
| `Ctrl/Cmd + Z` | Undo the latest available application change |
| `Enter` in capture | Add the task |

Global shortcuts step aside in inputs, textareas, selects, editable content, and dialogs. A shortcuts reference is available in **Settings & backup**. Native dialogs provide modal focus containment and Escape handling; closing restores the invoking control or a stable capture fallback. Controls have accessible names, visible focus, live feedback, and reduced-motion support. Full screen-reader and real-device conformance testing has not been performed.

## Storage, recovery, and backups

The canonical storage remains the legacy `todo-projects` localStorage key: an array of `{ id, name, todos }` projects. Each task retains `id`, `title`, `description`, `dueDate`, `priority`, and `completed`. New tasks also record `createdAt`; legacy tasks with no creation timestamp keep it unknown. Entry-order sorting uses the persisted project/task sequence; it does not invent historical creation times. Moving a task places it at the end of its destination project.

Existing IDs and user text are preserved. Missing optional fields receive defaults. Invalid legacy date text remains intact and appears as undated until corrected in the editor. Malformed structures, duplicate IDs, denied storage access, or corrupt JSON enter recovery mode. Ledger keeps the original bytes and blocks writes; **Settings & backup → Download original recovery data** is available when those bytes could be read. There is no automatic reset or destructive migration.

Mutations use a snapshot and save atomically. If persistence fails, state rolls back and a persistent warning appears; capture/editor drafts remain available for correction or retry. Export contains the last committed application state, not unsaved form drafts. Theme-write failure is reported separately.

Backups use this envelope:

```json
{
  "format": "ledger",
  "version": 1,
  "exportedAt": "an ISO timestamp",
  "projects": []
}
```

Import also accepts the legacy project-array format. It rejects unsupported versions, malformed fields, impossible dates, duplicate IDs, unsafe object keys, files larger than 5 MiB, and more than 10,000 tasks. Correct invalid legacy dates before restoring an exported backup that contains them. Validation finishes before replacement is offered, and a failed write preserves the current ledger. Import can recover blocked storage once saving is possible. Recovery-mode replacement cannot Undo an unreadable original; download that original first. Normal replacement can be undone until the next data change or reload.

Browser storage belongs to this origin and browser profile. Clearing site data removes it; export regularly before changing devices. There is no cloud sync or encryption layer. If another tab changes or clears task storage, this tab blocks further writes and asks you to export/reload rather than overwrite newer work. Live merging is not supported.

## Architecture

The runtime remains vanilla JavaScript ES modules, semantic HTML, CSS, and Webpack. No UI framework or runtime service was added. jsdom is a development-only test dependency.

| Module | Responsibility |
|---|---|
| `src/index.js` | Load styles and mount the application |
| `src/app.js` | Event orchestration, navigation, drafts, themes, dialogs, focus, and feedback |
| `src/ui.js` | Safe DOM rendering, authored SVG icons, navigation, task lists, and daily review |
| `src/todo.js` | Task validation, calendar validation, creation, and atomic editing |
| `src/project.js` | Project names, membership, and stable task moves |
| `src/views.js` | Pure search/filter/sort, local-date classification, and derived weekly views |
| `src/store.js` | Canonical projects, guarded mutation, persistence rollback, and snapshot Undo |
| `src/storage.js` | Legacy normalization, read/write recovery, validated import, and versioned export |

Search updates the results region without rebuilding navigation or capture, preserving the search caret. Derived rows reference canonical project-owned tasks; no smart view is persisted. User and imported text is inserted through DOM text APIs. Date-only values use local calendar fields, with no UTC midnight parsing.

## Verification and limits

See [the implementation plan](docs/plans/2026-10-24-ledger-2-plan.md), [initial audit](docs/audit.md), and [validation report](docs/browser-verification.md) for actual evidence and limitations. Node/jsdom checks cover domain, persistence, and application workflows; jsdom substitutes native dialog APIs and does not prove browser focus or layout behavior. Those are checked separately in a real browser.

Ledger has no subtasks, recurrence, reminders, drag ordering, historical productivity analytics, timers, or installable offline/PWA shell. The app works locally after its assets load; first-load offline installation is not provided. Spectral is loaded from Google Fonts with a readable local serif fallback. Large ledgers are searchable, but task lists are not virtualized.
