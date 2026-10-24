import test from "node:test";
import assert from "node:assert/strict";
import { createTodo } from "../src/todo.js";

test("new tasks need only a title and get safe optional defaults", () => {
  const todo = createTodo({ title: "  Read the proposal  " });
  assert.equal(todo.title, "Read the proposal");
  assert.equal(todo.description, "");
  assert.equal(todo.dueDate, "");
  assert.equal(todo.priority, "medium");
  assert.equal(todo.completed, false);
  assert.ok(todo.createdAt);
});

test("task validation rejects impossible calendar dates", () => {
  assert.throws(
    () =>
      createTodo({ title: "Plan", dueDate: "2025-02-29", priority: "medium" }),
    /date/i,
  );
});

const { updateTodo, toggleComplete } = await import("../src/todo.js");
const {
  createProject,
  addTodoToProject,
  removeProject,
  renameProject,
  moveTodo,
} = await import("../src/project.js");
const { localDate, dateStatus, prettyDate, allTasks, selectTasks, sevenDays } =
  await import("../src/views.js");
const task = (id, fields = {}) => ({
  id,
  title: id,
  description: "",
  dueDate: "",
  priority: "medium",
  completed: false,
  createdAt: "",
  ...fields,
});
const fixtures = () => [
  {
    id: "p1",
    name: "Work",
    todos: [
      task("overdue", {
        dueDate: "2026-10-23",
        priority: "high",
        description: "Read Proposal",
      }),
      task("today", { dueDate: "2026-10-24" }),
      task("done", { completed: true, dueDate: "2026-10-24" }),
    ],
  },
  {
    id: "p2",
    name: "Home",
    todos: [
      task("future", { dueDate: "2026-10-25", priority: "low" }),
      task("undated"),
      task("invalid", { dueDate: "2026-02-30" }),
    ],
  },
];

test("task validation handles empty input, wrong types, and leap years", () => {
  for (const title of ["", "  ", null, 2])
    assert.throws(() => createTodo({ title }));
  for (const dueDate of [
    "2026-13-01",
    "2026-04-31",
    "2026-2-04",
    "0000-01-01",
    null,
  ])
    assert.throws(() => createTodo({ title: "Read", dueDate }));
  assert.equal(
    createTodo({ title: "Leap day", dueDate: "2024-02-29" }).dueDate,
    "2024-02-29",
  );
  assert.throws(() => createTodo({ title: "Read", priority: "urgent" }));
  assert.throws(() => createTodo({ title: "Read", description: {} }));
});

test("editing is atomic and retains identity, completion, and creation time", () => {
  const todo = createTodo({ title: "Before" });
  toggleComplete(todo);
  const before = structuredClone(todo);
  assert.throws(() => updateTodo(todo, { title: "Changed", dueDate: "nope" }));
  assert.deepEqual(todo, before);
  updateTodo(todo, {
    title: " After ",
    description: "Notes",
    dueDate: "2026-12-31",
    priority: "high",
    id: "evil",
    completed: false,
  });
  assert.equal(todo.title, "After");
  assert.equal(todo.description, "Notes");
  assert.equal(todo.dueDate, "2026-12-31");
  assert.equal(todo.priority, "high");
  assert.equal(todo.id, before.id);
  assert.equal(todo.completed, true);
  assert.equal(todo.createdAt, before.createdAt);
});

test("project rename rejects duplicate names without altering legacy duplicates", () => {
  const projects = fixtures();
  assert.throws(() => createProject("  "));
  assert.throws(
    () => renameProject(projects, "p2", "  wOrK "),
    /already exists/,
  );
  assert.equal(projects[1].name, "Home");
  renameProject(projects, "p2", "  Personal ");
  assert.equal(projects[1].name, "Personal");
  assert.throws(() => renameProject(projects, "missing", "Other"));
});

test("moving a task preserves the object once and repeated moves do not duplicate it", () => {
  const projects = fixtures();
  const original = projects[0].todos[0];
  moveTodo(projects, original.id, "p2");
  moveTodo(projects, original.id, "p2");
  assert.equal(projects[1].todos.at(-1), original);
  assert.equal(
    allTasks(projects).filter(({ todo }) => todo.id === original.id).length,
    1,
  );
  assert.throws(() => moveTodo(projects, original.id, "missing"));
  assert.throws(() => addTodoToProject(projects[1], original));
  removeProject(projects, "p1");
  assert.equal(projects.length, 1);
});

test("calendar classifications use local date fields and reject invalid dates", () => {
  assert.equal(localDate(new Date(2026, 9, 24, 0, 1)), "2026-10-24");
  for (const [date, expected] of [
    ["2026-10-23", "overdue"],
    ["2026-10-24", "today"],
    ["2026-10-25", "upcoming"],
    ["", "undated"],
    ["2026-02-30", "undated"],
  ]) {
    assert.equal(dateStatus(date, false, "2026-10-24"), expected);
  }
  assert.equal(dateStatus("2026-10-23", true, "2026-10-24"), "completed");
  assert.equal(prettyDate("bad"), "No due date");
  assert.match(prettyDate("2026-10-24"), /2026/);
});

test("smart views derive tasks without changing ownership or stored order", () => {
  const projects = fixtures();
  const before = structuredClone(projects);
  const ids = (options) =>
    selectTasks(projects, options, "2026-10-24").map(({ todo }) => todo.id);
  assert.deepEqual(ids({ view: "today" }), ["overdue", "today"]);
  assert.deepEqual(ids({ view: "upcoming" }), ["future"]);
  assert.deepEqual(ids({ view: "completed" }), ["done"]);
  assert.equal(ids({ view: "all" }).length, 6);
  assert.deepEqual(ids({ view: "project", projectId: "p2", sort: "title" }), [
    "future",
    "invalid",
    "undated",
  ]);
  assert.deepEqual(projects, before);
});

test("search and all filters combine predictably", () => {
  const projects = fixtures();
  const select = (options) =>
    selectTasks(projects, { view: "all", ...options }, "2026-10-24").map(
      ({ todo }) => todo.id,
    );
  assert.deepEqual(
    select({
      query: "  PROPOSAL ",
      priority: "high",
      status: "open",
      projectId: "p1",
      due: "overdue",
    }),
    ["overdue"],
  );
  assert.deepEqual(select({ status: "completed", due: "today" }), ["done"]);
  assert.deepEqual(select({ due: "undated" }), ["undated", "invalid"]);
  assert.deepEqual(select({ day: "2026-10-25" }), ["future"]);
  assert.deepEqual(select({ query: "nothing" }), []);
});

test("sorting orders priorities and places missing/invalid due dates last", () => {
  const projects = fixtures();
  assert.deepEqual(
    selectTasks(projects, { view: "all", sort: "priority" }).map(
      ({ todo }) => todo.priority,
    ),
    ["high", "medium", "medium", "medium", "medium", "low"],
  );
  assert.deepEqual(
    selectTasks(projects, { view: "all", sort: "due" }).map(
      ({ todo }) => todo.id,
    ),
    ["overdue", "today", "done", "future", "undated", "invalid"],
  );
  const created = [
    {
      id: "p",
      name: "One",
      todos: [
        task("new", { createdAt: "2026-10-25T10:00:00.000Z" }),
        task("old", { createdAt: "2026-10-23T10:00:00.000Z" }),
      ],
    },
  ];
  assert.deepEqual(
    selectTasks(created, { view: "all", sort: "created" }).map(
      ({ todo }) => todo.id,
    ),
    ["new", "old"],
  );
});

test("seven days crosses month/year and excludes completed workload", () => {
  const projects = [
    {
      id: "p",
      name: "Home",
      todos: [
        task("past", { dueDate: "2026-12-30" }),
        task("today", { dueDate: "2026-12-31" }),
        task("next", { dueDate: "2027-01-01" }),
        task("done", { dueDate: "2027-01-01", completed: true }),
      ],
    },
  ];
  const days = sevenDays(projects, new Date(2026, 11, 31, 23));
  assert.equal(days.length, 7);
  assert.equal(days[0].date, "2026-12-31");
  assert.equal(days[0].count, 1);
  assert.equal(days[0].overdue, 1);
  assert.equal(days[1].date, "2027-01-01");
  assert.equal(days[1].count, 1);
});
