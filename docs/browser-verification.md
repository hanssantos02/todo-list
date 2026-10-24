# Ledger 2.0 validation

Verified on 2026-10-24 in the Codex in-app browser against the running local application. All populated browser entries were explicitly labelled `(test)`; none are shipped seed data. The originally empty Default project and System theme were restored after QA, retaining its original project ID.

## Executed automated checks

| Check | Observed result |
|---|---|
| `npm ci` | Clean lockfile install succeeded |
| `npm test` | 43 tests passed, 0 failed |
| `npm run test:tz` | 26 tests passed under America/Los_Angeles |
| `npm run build` | Production compilation succeeded without warnings; main.js 56.1 KiB |
| `npm audit` | 0 vulnerabilities, including development dependencies |
| `git diff --check` | Passed |

Node tests cover task validation/editing, stable moves, project names, local calendar boundaries, derived smart views, combined search/filter/sort, legacy normalization, import validation/size/task limits, denied/quota storage, rollback, Undo, and real domain/store/storage reload chains. Seventeen jsdom application tests cover capture, full editing/cancel, project flows, Focus, filtering, themes, shortcuts, corruption, failed saves, cross-tab conflict, import/cancel/replace/Undo, untrusted text, rollover defaults, canceled deferred imports, a 600-task/30-project ledger with long multilingual text, and rapid repeated capture submission.

Three review regressions were observed failing before the controller fixes, then passing: conflicting filters, overnight capture, and deferred-import cancellation. The domain worker separately observed preimplementation failures for task defaults, invalid calendar dates, and missing migration/rollback APIs. No existing lint or typecheck configuration was present; JavaScript syntax and the production compiler were checked. jsdom substitutes native dialog APIs, so its tests do not prove real modal focus or layout.

## Actual browser workflows

- Captured title-only tasks; opened optional details; created future and undated entries.
- Created and switched projects; edited title, notes, due date, priority, and project ownership; verified original ownership count dropped and destination count increased.
- Canceled a changed title and verified it was not saved.
- Reviewed Today overdue/due sections and Upcoming future-only results.
- Entered Focus, completed a task, and restored it with Undo.
- Exercised `N`, `/`, typing `/` inside capture, Escape from the editor, and native Ctrl+Z outside inputs. Focus returned to the invoking task after Escape.
- Exported a real JSON file, selected it through the file chooser, verified replacement counts, restored it, and reloaded successfully.
- Switched Light, Dark, and System themes; persisted selections survived reload. System was restored after QA.
- Opened mobile navigation and settings, and edited tasks at phone width. Tall dialogs remain internally scrollable.
- Restored the original empty ledger. A fresh app tab showed zero tasks, and its startup warning/error log was empty.

Project rename/final-project deletion, malformed imports, quota/denied storage, many/long entries, and cross-tab conflicts were exercised in automated integration/domain tests rather than all repeated manually in the browser. No real phone, touchscreen, screen reader, Safari, or Firefox test was performed.

## Responsive and accessibility evidence

Inspected target viewports 375×812, 768×1024, 1440×1000, and the initial in-app width 1089×945; both themes at the three representative widths. Native browser content captures exclude scrollbar/browser chrome, so image dimensions differ slightly from the requested viewport.

The first valid visual review found two material issues: mobile Today placed the first task below the fold, and Focus had an unnecessary decorative eyebrow. One correction batch compacted only phone spacing and removed that label. The final mobile first task begins around y=704px, with its title, completion control, and due status visible. The reviewer scored both findings resolved with disposition `ship`; this targeted verdict is not a claim of exhaustive WCAG conformance.

Measured source palette contrast against paper:

| Text role | Light | Dark |
|---|---:|---:|
| Primary ink | 15.67:1 | 14.00:1 |
| Secondary ink | 5.96:1 | 8.18:1 |
| High priority/overdue | 5.87:1 | 7.90:1 |
| Medium priority | 5.17:1 | 8.78:1 |
| Low priority | 5.56:1 | 8.81:1 |

Semantic forms, accessible names, native modal containment, live messages, visible focus, text status labels, forced-color styling, and reduced-motion CSS were inspected. Task completion and icon targets are 44px; smaller task-title links have an adjacent full-size edit control. Document width stayed within the phone/tablet viewport in the inspected states.

The mechanical Impeccable detector ran once. Its sole warning was `flat-type-hierarchy` on the HTML template: it did not follow the stylesheet imported through Webpack. Computed body text is 16px and phone h1 is 40px, with larger desktop headings; the warning was a verified false positive.

## Capture and review limitations

The first full-page capture API produced invalid width/reflow images. These were rejected before review and replaced using the stable viewport screenshot API; every replacement was opened and checked. The valid set lives in the local ignored `.impeccable/review/` directory. Desktop/mobile/tablet themes, reported viewport, task editor, navigation, settings, and Focus were captured. Screenshots show synthetic QA entries clearly labelled `(test)`.

During clean installation, replacing node_modules interrupted the running development server. It was restarted, and the final fresh tab loaded correctly. Earlier development-tab logs included transient HMR/compilation messages while source files were changing; those are not claimed as final runtime failures or hidden as a clean log from that tab.

See `docs/code-review.md` for the independent code-review receipt and fixes, and `docs/design-review.md` for the visual review and targeted verdict. Full assistive-technology/device/browser-matrix testing remains a follow-up.
