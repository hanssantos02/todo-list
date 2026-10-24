import test from "node:test";
import assert from "node:assert/strict";
import * as storage from "../src/storage.js";

const legacy = [
  {
    id: "p",
    name: "Home",
    todos: [{ id: "t", title: "Read", completed: false }],
  },
];
const memory = (raw) => ({ getItem: () => raw, setItem() {} });

test("legacy optional fields migrate without inventing creation history", () => {
  assert.equal(typeof storage.readProjects, "function");
  const result = storage.readProjects(memory(JSON.stringify(legacy)));
  assert.equal(result.blocked, false);
  assert.equal(result.projects[0].todos[0].priority, "medium");
  assert.equal(result.projects[0].todos[0].createdAt, "");
});

test("corrupt local data retains original raw bytes and blocks writes", () => {
  assert.equal(typeof storage.readProjects, "function");
  const result = storage.readProjects(memory("{broken"));
  assert.equal(result.blocked, true);
  assert.equal(result.raw, "{broken");
});

test("unavailable storage and quota errors return failures without crashing", () => {
  const failure = {
    getItem() {
      throw new Error("Denied");
    },
    setItem() {
      throw new Error("Quota");
    },
  };
  assert.equal(storage.readProjects(failure).blocked, true);
  assert.equal(storage.saveProjects(legacy, failure), false);
  assert.equal(storage.saveProjects(undefined, memory(null)), false);
  assert.deepEqual(storage.loadProjects(memory(null)), []);
});

test("malformed structures are blocked; invalid legacy date text stays intact", () => {
  for (const value of [{}, [null], [{ id: "p", name: "Home", todos: {} }]]) {
    assert.equal(
      storage.readProjects(memory(JSON.stringify(value))).blocked,
      true,
    );
  }
  const projects = structuredClone(legacy);
  projects[0].todos[0].dueDate = "not-a-date";
  const loaded = storage.readProjects(memory(JSON.stringify(projects)));
  assert.equal(loaded.blocked, false);
  assert.equal(loaded.projects[0].todos[0].dueDate, "not-a-date");
});

test("versioned and legacy backups round trip IDs and user content", () => {
  const projects = storage.readProjects(
    memory(JSON.stringify(legacy)),
  ).projects;
  projects[0].todos[0].description = "<script>unsafe text stays text</script>";
  assert.deepEqual(
    storage.parseBackup(storage.exportBackup(projects)),
    projects,
  );
  assert.deepEqual(storage.parseBackup(JSON.stringify(projects)), projects);
  assert.deepEqual(storage.parseBackup("[]"), []);
});

test("import rejects unsupported versions, malformed JSON, and unsafe keys", () => {
  for (const raw of [
    "{bad",
    "{}",
    '{"format":"ledger","version":2,"projects":[]}',
    '[{"__proto__":{}}]',
    '[{"constructor":{}}]',
  ]) {
    assert.throws(() => storage.parseBackup(raw));
  }
  assert.throws(
    () => storage.parseBackup(" ".repeat(5 * 1024 * 1024 + 1)),
    /5 MB/,
  );
});

test("import rejects duplicate IDs, wrong types, and invalid optional values", () => {
  for (const change of [
    (projects) => projects[0].todos.push({ ...projects[0].todos[0] }),
    (projects) => {
      projects[0].todos[0].id = "p";
    },
    (projects) => {
      projects[0].todos[0].completed = "false";
    },
    (projects) => {
      projects[0].todos[0].dueDate = "2026-02-29";
    },
    (projects) => {
      projects[0].todos[0].priority = "urgent";
    },
    (projects) => {
      projects[0].todos[0].description = {};
    },
    (projects) => {
      projects[0].todos[0].createdAt = "yesterday";
    },
  ]) {
    const projects = structuredClone(legacy);
    change(projects);
    assert.throws(() => storage.parseBackup(JSON.stringify(projects)));
  }
});

test("import task limit is explicit", () => {
  const todos = Array.from({ length: 10001 }, (_, index) => ({
    id: `t${index}`,
    title: "Read",
  }));
  assert.throws(
    () =>
      storage.parseBackup(JSON.stringify([{ id: "p", name: "Home", todos }])),
    /10,000/,
  );
});
