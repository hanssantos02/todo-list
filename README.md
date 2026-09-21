# Ledger — a quiet todo

A calm, editorial todo app built for [The Odin Project: Project Todo List](https://www.theodinproject.com/lessons/node-path-javascript-todo-list). Projects act as an index, tasks as ruled ledger entries. Data persists in `localStorage`, so a refresh never loses the ledger.

## Run it

```bash
npm install
npm start   # webpack dev server, opens http://localhost:8080
npm run build  # one-time production bundle into dist/
```

Stack: vanilla JS (ES modules), webpack 5 + `HtmlWebpackPlugin`, `date-fns` for display dates. No framework.

## Features

- **Projects (index):** create via the sidebar form (empty names rejected with an inline error), switch with one click, delete with a two-click arm-and-confirm trash button. Deleting the last project re-seeds a `Default` project so the app never has zero projects or a dangling selection.
- **Todos (entries):** title (required), notes/description (optional), due date, priority (`low | medium | high`). Add via the capture form; validation errors render inline, bad input is never saved.
- **Per-entry controls:** round check button toggles complete (struck-through title + `Done/Open` seal), `Details/Notes` expands the description (disabled when there are no notes), `Edit` opens an inline priority editor with Save/Cancel, `Delete` removes by id.
- **Dates:** stored as raw `yyyy-mm-dd` strings, displayed as `MMM d, yyyy` via `date-fns` (`prettyDate` falls back to `No date` / `Invalid date` instead of crashing). Past-due, incomplete entries gain an `overdue` seal.
- **Chrome:** masthead shows today's date plus live `done of total` progress; project header shows `open · done` counts; sidebar shows the project count.

## Architecture

One source of truth lives in `src/index.js` (`projects` array + `activeId`). Every mutation follows **change → save → draw**. The UI never invents state — it receives data plus callbacks.

| Module | Owns | Exposes |
|---|---|---|
| `src/todo.js` | todo shape + rules (id, validation, toggle) | `createTodo`, `toggleComplete` |
| `src/project.js` | project shape + list membership | `createProject`, `addTodoToProject`, `removeTodoFromProject`, `removeProject` |
| `src/storage.js` | persistence only (key `todo-projects`), quota + corrupt-data guards | `saveProjects`, `loadProjects` |
| `src/ui.js` | rendering + display helpers (no store imports) | `renderProjects`, `renderTodos` |
| `src/index.js` | store, wiring, form handlers, masthead counts | nothing (entry point) |

Data model:

```js
todo = { id: string, title: string, description: string,
         dueDate: string, priority: 'low'|'medium'|'high', completed: boolean }
project = { id: string, name: string, todos: Todo[] }
```

Invalid input throws at the boundary (`Title must not be empty`, bad priority, empty project name) and forms surface it via `showError` rather than `alert`-and-lose-data (a legacy `prompt` fallback remains in `onEdit` only when called without a value).

## Edge cases handled

Empty/corrupt/missing storage returns `[]`; non-array payloads are rejected; empty todo list renders an illustrated empty state; project delete asks twice and preserves selection invariants; form listeners attach once, outside `draw()`.
