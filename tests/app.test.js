import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { mountApp } from "../src/app.js";
import { exportBackup } from "../src/storage.js";

const html = readFileSync(
  new URL("../src/template.html", import.meta.url),
  "utf8",
);
const fixed = new Date(2026, 9, 24, 10);
let app, dom;
const old = {
  document: globalThis.document,
  window: globalThis.window,
  FormData: globalThis.FormData,
};
function setup(data, options = {}) {
  dom = new JSDOM(html, { url: "http://localhost/" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.FormData = dom.window.FormData;
  dom.window.matchMedia = () =>
    Object.assign(new dom.window.EventTarget(), { matches: false });
  dom.window.Element.prototype.scrollIntoView = function () {};
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event("close"));
  };
  if (data !== undefined)
    dom.window.localStorage.setItem(
      "todo-projects",
      typeof data === "string" ? data : JSON.stringify(data),
    );
  app = mountApp({
    storage: dom.window.localStorage,
    now: () => fixed,
    ...options,
  });
  return dom.window.document;
}
const fixture = () => [
  {
    id: "p1",
    name: "Work",
    todos: [
      {
        id: "t1",
        title: "A task",
        description: "Notes to search",
        dueDate: "2026-10-24",
        priority: "high",
        completed: false,
      },
    ],
  },
  { id: "p2", name: "Home", todos: [] },
];
const $ = (selector) => document.querySelector(selector);
const click = (selector) => $(selector).click();
const input = (selector, value) => {
  $(selector).value = value;
  $(selector).dispatchEvent(new window.Event("input", { bubbles: true }));
};
const change = (selector, value) => {
  $(selector).value = value;
  $(selector).dispatchEvent(new window.Event("change", { bubbles: true }));
};
const submit = (selector) =>
  $(selector).dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }),
  );
const all = () => app.store.projects.flatMap((p) => p.todos);
afterEach(() => {
  app?.destroy();
  dom?.window.close();
  Object.assign(globalThis, old);
});

test("capture, complete, Undo, and reload use the real app/storage chain", () => {
  setup();
  input("#capture-title", "Plan the garden");
  submit("#capture-form");
  assert.equal(all().length, 1);
  assert.equal(all()[0].dueDate, "2026-10-24");
  assert.match($("#tasks").textContent, /Plan the garden/);
  click('#tasks [data-action="toggle"]');
  assert.equal(all()[0].completed, true);
  assert.equal($('#tasks [data-action="toggle"]'), null);
  click("#undo");
  assert.equal(all()[0].completed, false);
  assert.equal(app.store.undoAvailable, false);
  const saved = window.localStorage.getItem("todo-projects");
  app.destroy();
  setup(saved);
  assert.equal(all()[0].title, "Plan the garden");
});
test("invalid capture preserves draft, reports an error, and stores nothing", () => {
  setup();
  input("#capture-title", "   ");
  submit("#capture-form");
  assert.equal(all().length, 0);
  assert.equal($("#capture-title").value, "   ");
  assert.match($("#capture-error").textContent, /empty/);
  assert.equal(document.activeElement.id, "capture-title");
});
test("every editable field saves atomically, moves once, and Cancel discards a draft", () => {
  setup(fixture());
  click("#tasks .task-title");
  input("#edit-title", "Revised");
  input("#edit-description", "New notes");
  $("#edit-date").value = "2026-12-31";
  $("#edit-priority").value = "low";
  $("#edit-project").value = "p2";
  submit("#task-form");
  const task = all()[0];
  assert.equal(task.id, "t1");
  assert.equal(task.title, "Revised");
  assert.equal(task.description, "New notes");
  assert.equal(task.dueDate, "2026-12-31");
  assert.equal(task.priority, "low");
  assert.equal(app.store.projects[0].todos.length, 0);
  assert.equal(app.store.projects[1].todos.length, 1);
  click('#desktop-sidebar [data-view="all"]');
  click("#tasks .task-title");
  input("#edit-title", "Never saved");
  click("#task-dialog .dialog-footer [data-close]");
  assert.equal(all()[0].title, "Revised");
});
test("create, rename, duplicate rejection, final-project deletion and Undo remain usable", () => {
  setup();
  click('#desktop-sidebar [data-action="create-project"]');
  input("#project-name", "Garden");
  submit("#project-form");
  assert.equal(app.store.projects.length, 2);
  assert.equal($("#view-title").textContent, "Garden");
  click('[data-action="rename-project"]');
  input("#project-name", " Default ");
  submit("#project-form");
  assert.match($("#project-error").textContent, /already exists/);
  assert.equal($("#project-dialog").open, true);
  input("#project-name", "Outside");
  submit("#project-form");
  assert.equal(app.store.projects[1].name, "Outside");
  click('[data-action="delete-project"]');
  click("#confirm-action");
  assert.equal(app.store.projects.length, 1);
  click('#desktop-sidebar [data-action="project"]');
  const id = app.store.projects[0].id;
  click('[data-action="delete-project"]');
  click("#confirm-action");
  assert.equal(app.store.projects[0].name, "Default");
  assert.notEqual(app.store.projects[0].id, id);
  click("#undo");
  assert.equal(app.store.projects[0].id, id);
});
test("smart views, notes search, combined filters and sort update without losing search focus", () => {
  const data = fixture();
  data[0].todos.push(
    {
      id: "t2",
      title: "Later",
      description: "Notes to search",
      dueDate: "2026-10-26",
      priority: "low",
      completed: false,
    },
    {
      id: "t3",
      title: "Undated",
      description: "",
      dueDate: "",
      priority: "medium",
      completed: true,
    },
  );
  setup(data);
  assert.equal($("#tasks .task-row")?.dataset.taskId, "t1");
  click('#desktop-sidebar [data-view="upcoming"]');
  assert.match($("#tasks").textContent, /Later/);
  assert.doesNotMatch($("#tasks").textContent, /Undated/);
  click('#desktop-sidebar [data-view="all"]');
  $("#search").focus();
  input("#search", "notes");
  assert.equal(document.activeElement.id, "search");
  assert.equal(document.querySelectorAll(".task-row").length, 2);
  change("#filter-priority", "low");
  assert.equal(document.querySelectorAll(".task-row").length, 1);
  assert.match($("#tasks").textContent, /Later/);
  click('[data-action="clear-filters"]');
  assert.equal(document.querySelectorAll(".task-row").length, 3);
  change("#sort", "title");
  assert.equal($(".task-title").textContent, "A task");
  click('#desktop-sidebar [data-view="completed"]');
  click('#tasks [data-action="toggle"]');
  assert.equal(all().find((t) => t.id === "t3").completed, false);
});
test("weekly selection shows selected open tasks and Focus completion is reversible", () => {
  setup(fixture());
  click('#week [data-day="2026-10-24"]');
  assert.equal(document.querySelectorAll(".task-row").length, 1);
  click('#tasks [data-action="focus"]');
  assert.equal($("#focus-title").textContent, "A task");
  assert.equal($("#focus-notes").textContent, "Notes to search");
  click("#focus-complete");
  assert.equal(all()[0].completed, true);
  assert.equal($("#focus-dialog").open, false);
  click("#undo");
  assert.equal(all()[0].completed, false);
});
test("shortcuts respect editable targets, and theme choice persists across a remount", () => {
  setup(fixture());
  $("#main").focus();
  document.activeElement.dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "n",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal(document.activeElement.id, "capture-title");
  $("#capture-title").dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "/",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal(document.activeElement.id, "capture-title");
  $("#main").focus();
  document.activeElement.dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "/",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal(document.activeElement.id, "search");
  change("#theme", "dark");
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(window.localStorage.getItem("ledger-theme"), "dark");
  app.destroy();
  app = mountApp({ storage: dom.window.localStorage, now: () => fixed });
  assert.equal(document.documentElement.dataset.theme, "dark");
});
test("corrupt storage is never overwritten by startup or a failed capture", () => {
  setup("{bad");
  input("#capture-title", "A draft");
  submit("#capture-form");
  assert.equal(window.localStorage.getItem("todo-projects"), "{bad");
  assert.equal($("#capture-title").value, "A draft");
  assert.equal($("#storage-warning").hidden, false);
  assert.equal($("#export-recovery").hidden, false);
});
test("quota errors roll back, retain input, and show a persistent warning", () => {
  const data = fixture();
  const memory = {
    getItem: (key) => (key === "todo-projects" ? JSON.stringify(data) : null),
    setItem: () => {
      throw new Error("quota");
    },
  };
  setup(undefined, { storage: memory });
  input("#capture-title", "Keep this draft");
  submit("#capture-form");
  assert.equal(all().length, 1);
  assert.equal($("#capture-title").value, "Keep this draft");
  assert.match($("#storage-warning").textContent, /could not save/);
});
test("external writes block mutation and old Undo without discarding current data", () => {
  setup(fixture());
  input("#capture-title", "One more");
  submit("#capture-form");
  window.dispatchEvent(
    new window.StorageEvent("storage", {
      key: "todo-projects",
      newValue: "[]",
    }),
  );
  assert.equal(app.store.undoAvailable, false);
  assert.match($("#storage-warning").textContent, /another tab/);
  input("#capture-title", "Blocked");
  submit("#capture-form");
  assert.equal(all().length, 2);
  assert.equal($("#capture-title").value, "Blocked");
});
test("backup import validates, cancellation preserves state, confirmation replaces and Undo restores", async () => {
  setup(fixture());
  click('#desktop-sidebar [data-action="settings"]');
  const backup = exportBackup([
    { id: "replacement", name: "Restored", todos: [] },
  ]);
  const choose = async (text) => {
    Object.defineProperty($("#import-file"), "files", {
      configurable: true,
      value: [{ size: text.length, text: async () => text }],
    });
    $("#import-file").dispatchEvent(
      new window.Event("change", { bubbles: true }),
    );
    await new Promise((resolve) => setImmediate(resolve));
  };
  await choose("{oops");
  assert.match($("#data-error").textContent, /valid JSON/);
  assert.equal(all().length, 1);
  await choose(backup);
  assert.equal($("#confirm-dialog").open, true);
  click("#confirm-dialog [data-close]");
  assert.equal(all().length, 1);
  await choose(backup);
  click("#confirm-action");
  assert.equal(app.store.projects[0].id, "replacement");
  click("#undo");
  assert.equal(all()[0].id, "t1");
});
test("untrusted imported titles and notes are text, with no injected elements", () => {
  const data = fixture();
  data[0].name = "<b>Work</b>";
  data[0].todos[0].title = "<img src=x onerror=alert(1)>";
  data[0].todos[0].description = "<script>bad()</script>";
  setup(data);
  assert.equal(document.querySelector("#tasks img"), null);
  click('#tasks [data-action="notes"]');
  assert.equal(document.querySelector("#tasks script"), null);
  assert.match($("#tasks").textContent, /<script>/);
});

test("project and selected-day filters intersect rather than overriding a selection", () => {
  setup(fixture());
  click('#desktop-sidebar [data-project-id="p1"]');
  change("#filter-project", "p2");
  assert.equal(document.querySelectorAll(".task-row").length, 0);
  click('#desktop-sidebar [data-view="today"]');
  click('#week [data-day="2026-10-24"]');
  change("#filter-status", "completed");
  assert.equal(document.querySelectorAll(".task-row").length, 0);
});

test("overnight refresh advances the automatic Today date and preserves an explicit date", () => {
  let clock = new Date(2026, 9, 24, 23, 59);
  setup(fixture(), { now: () => clock });
  clock = new Date(2026, 9, 25, 0, 1);
  window.dispatchEvent(new window.Event("focus"));
  assert.equal($("#capture-date").value, "2026-10-25");
  change("#capture-date", "2026-11-02");
  clock = new Date(2026, 9, 26, 0, 1);
  window.dispatchEvent(new window.Event("focus"));
  assert.equal($("#capture-date").value, "2026-11-02");
});

test("closing settings cancels a pending file read without interrupting a new edit", async () => {
  setup(fixture());
  click('#desktop-sidebar [data-action="settings"]');
  let finishRead;
  const reading = new Promise((resolve) => {
    finishRead = resolve;
  });
  Object.defineProperty($("#import-file"), "files", {
    configurable: true,
    value: [{ size: 1, text: () => reading }],
  });
  $("#import-file").dispatchEvent(
    new window.Event("change", { bubbles: true }),
  );
  click("#settings-dialog [data-close]");
  click("#tasks .task-title");
  input("#edit-title", "Keep this unsaved draft");
  finishRead(
    exportBackup([{ id: "replacement", name: "Replacement", todos: [] }]),
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal($("#task-dialog").open, true);
  assert.equal($("#confirm-dialog").open, false);
  assert.equal($("#edit-title").value, "Keep this unsaved draft");
  assert.equal(all()[0].id, "t1");
});

test("a large ledger and long untrusted text stay searchable without duplicating entries", () => {
  const projects = Array.from({ length: 30 }, (_, p) => ({
    id: `project-${p}`,
    name: `Project ${p} — ${"Long name ".repeat(5)}`,
    todos: Array.from({ length: 20 }, (_, t) => ({
      id: `task-${p}-${t}`,
      title: `Task ${p}/${t} ${"<tag>長い文字".repeat(30)}`,
      description: `Context for project ${p} entry ${t}`,
      dueDate: "2026-10-24",
      priority: "medium",
      completed: false,
    })),
  }));
  setup(projects);
  assert.equal(document.querySelectorAll(".task-row").length, 600);
  input("#search", "Context for project 29 entry 19");
  assert.equal(document.querySelectorAll(".task-row").length, 1);
  assert.equal($(".task-row").dataset.taskId, "task-29-19");
  assert.equal(document.querySelector("#tasks tag"), null);
  assert.equal(all().length, 600);
});

test("rapid repeated capture submissions never duplicate the same entry", () => {
  setup();
  input("#capture-title", "Capture this once");
  for (let i = 0; i < 10; i++) submit("#capture-form");
  assert.equal(all().length, 1);
  assert.equal(all()[0].title, "Capture this once");
});
