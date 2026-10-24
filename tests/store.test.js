import test from "node:test";
import assert from "node:assert/strict";

test("failed saves roll back task mutations", async () => {
  const { createStore } = await import("../src/store.js");
  const store = createStore([{ id: "p", name: "Home", todos: [] }], {
    save: () => false,
  });
  assert.throws(
    () =>
      store.mutate("Changed name", (projects) => {
        projects[0].name = "Lost";
      }),
    /save/i,
  );
  assert.equal(store.projects[0].name, "Home");
  assert.equal(store.undoAvailable, false);
});

const { createStore } = await import("../src/store.js");
const { createTodo, toggleComplete, updateTodo } =
  await import("../src/todo.js");
const { createProject, addTodoToProject, moveTodo, removeProject } =
  await import("../src/project.js");
const { saveProjects, readProjects, exportBackup, parseBackup } =
  await import("../src/storage.js");
const { selectTasks } = await import("../src/views.js");

function fixture() {
  return [
    {
      id: "p",
      name: "Home",
      todos: [{ id: "t", title: "Read", completed: false }],
    },
  ];
}

test("callback exceptions restore the entire snapshot and keep prior undo", () => {
  const store = createStore(fixture());
  store.mutate("Renamed", (projects) => {
    projects[0].name = "Personal";
  });
  assert.throws(() =>
    store.mutate("Bad change", (projects) => {
      projects[0].todos.length = 0;
      throw new Error("Invalid");
    }),
  );
  assert.equal(store.projects[0].todos.length, 1);
  assert.equal(store.undo(), "Renamed");
  assert.equal(store.projects[0].name, "Home");
});

test("only the latest data mutation can be undone once", () => {
  const store = createStore(fixture());
  store.mutate("Renamed", (projects) => {
    projects[0].name = "Personal";
  });
  store.mutate("Completed", (projects) => toggleComplete(projects[0].todos[0]));
  assert.equal(store.undo(), "Completed");
  assert.equal(store.projects[0].name, "Personal");
  assert.equal(store.projects[0].todos[0].completed, false);
  assert.equal(store.undo(), false);
  store.mutate("Renamed again", (projects) => {
    projects[0].name = "Other";
  });
  store.dismissUndo();
  assert.equal(store.undoAvailable, false);
});

test("deleting the final project produces a usable fallback and undo restores IDs", () => {
  const store = createStore(fixture());
  store.mutate("Project deleted", (projects) => removeProject(projects, "p"));
  assert.equal(store.projects.length, 1);
  assert.equal(store.projects[0].name, "Default");
  assert.notEqual(store.projects[0].id, "p");
  store.undo();
  assert.deepEqual(store.projects, fixture());
});

test("failed undo and replacement preserve state and recoverability", () => {
  let allowSave = true;
  const store = createStore(fixture(), { save: () => allowSave });
  store.mutate("Renamed", (projects) => {
    projects[0].name = "Personal";
  });
  allowSave = false;
  assert.throws(() => store.undo(), /save/);
  assert.equal(store.projects[0].name, "Personal");
  assert.equal(store.undoAvailable, true);
  assert.throws(() => store.replace([]), /save/);
  assert.equal(store.projects[0].name, "Personal");
  allowSave = true;
  store.undo();
  assert.equal(store.projects[0].name, "Home");
});

test("blocked recovery allows replacement only when saving succeeds", () => {
  let allowSave = false;
  const store = createStore([], { blocked: true, save: () => allowSave });
  assert.throws(
    () =>
      store.mutate("Change", (projects) =>
        projects.push(createProject("Home")),
      ),
    /recovery/,
  );
  assert.throws(() => store.replace(fixture()), /save/);
  assert.throws(() => store.mutate("Change", () => {}), /recovery/);
  allowSave = true;
  store.replace(fixture());
  assert.equal(store.undoAvailable, false);
  store.mutate("Renamed", (projects) => {
    projects[0].name = "Recovered";
  });
  assert.equal(store.projects[0].name, "Recovered");
});

test("real domain/store/storage chain survives editing, moves, completion, undo and reload", () => {
  let raw = null;
  const memory = {
    getItem: () => raw,
    setItem: (key, value) => {
      assert.equal(key, "todo-projects");
      raw = value;
    },
  };
  const project = createProject("Work");
  const store = createStore([project], {
    save: (projects) => saveProjects(projects, memory),
  });
  const todo = createTodo({ title: "Draft", dueDate: "2026-10-24" });
  store.mutate("Task added", (projects) => addTodoToProject(projects[0], todo));
  const destination = createProject("Home");
  store.mutate("Project added", (projects) => projects.push(destination));
  store.mutate("Task edited", (projects) => {
    updateTodo(projects[0].todos[0], {
      title: "Final",
      description: "Notes",
      priority: "high",
      dueDate: "2026-10-25",
    });
    moveTodo(projects, todo.id, destination.id);
  });
  store.mutate("Task completed", (projects) =>
    toggleComplete(projects[1].todos[0]),
  );
  assert.equal(selectTasks(store.projects, { view: "completed" }).length, 1);
  store.undo();
  const loaded = readProjects(memory);
  assert.equal(loaded.blocked, false);
  assert.equal(loaded.projects[1].todos[0].title, "Final");
  assert.equal(loaded.projects[1].todos[0].completed, false);
  assert.equal(
    selectTasks(loaded.projects, { view: "upcoming" }, "2026-10-24").length,
    1,
  );
  assert.deepEqual(parseBackup(exportBackup(loaded.projects)), loaded.projects);
});
