import { isValidDate } from "./todo.js";

const storageKey = "todo-projects";
const maxBackupBytes = 5 * 1024 * 1024;
const dangerousKeys = new Set(["__proto__", "prototype", "constructor"]);

function assertSafeKeys(value) {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (dangerousKeys.has(key))
      throw new Error("Backup contains an unsafe field.");
    assertSafeKeys(value[key]);
  }
}

function normalizeProjects(value, { strict = false, limited = false } = {}) {
  if (!Array.isArray(value)) throw new Error("Projects must be a list.");
  const ids = new Set();
  let taskCount = 0;
  const record = (item) =>
    item && typeof item === "object" && !Array.isArray(item);
  const id = (value) => {
    if (typeof value !== "string" || !value.trim() || ids.has(value))
      throw new Error("Project and task IDs must be unique text values.");
    ids.add(value);
    return value;
  };
  const text = (value, fallback, label) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string") throw new Error(`${label} must be text.`);
    return value;
  };
  return value.map((project) => {
    if (
      !record(project) ||
      typeof project.name !== "string" ||
      !project.name.trim() ||
      !Array.isArray(project.todos)
    ) {
      throw new Error("Each project needs an ID, name, and task list.");
    }
    const projectId = id(project.id);
    const todos = project.todos.map((todo) => {
      taskCount += 1;
      if (limited && taskCount > 10000)
        throw new Error("A backup can contain at most 10,000 tasks.");
      if (!record(todo) || typeof todo.title !== "string" || !todo.title.trim())
        throw new Error("Each task needs an ID and title.");
      const taskId = id(todo.id);
      const description = text(todo.description, "", "Task description");
      const dueDate = text(todo.dueDate, "", "Due date");
      const priority = text(todo.priority, "medium", "Priority");
      const createdAt = text(todo.createdAt, "", "Creation date");
      if (todo.completed !== undefined && typeof todo.completed !== "boolean")
        throw new Error("Completion state must be true or false.");
      if (!["low", "medium", "high"].includes(priority))
        throw new Error("Priority must be low, medium, or high.");
      if (strict && dueDate !== "" && !isValidDate(dueDate))
        throw new Error("Backup contains an invalid due date.");
      if (strict && createdAt !== "" && !Number.isFinite(Date.parse(createdAt)))
        throw new Error("Backup contains an invalid creation date.");
      return {
        id: taskId,
        title: todo.title,
        description,
        dueDate,
        priority,
        completed: todo.completed ?? false,
        createdAt,
      };
    });
    return { id: projectId, name: project.name, todos };
  });
}

export function readProjects(storage) {
  let raw = null;
  try {
    const target = storage ?? globalThis.localStorage;
    raw = target.getItem(storageKey);
    if (raw === null) return { projects: [], error: null, raw, blocked: false };
    const parsed = JSON.parse(raw);
    assertSafeKeys(parsed);
    return {
      projects: normalizeProjects(parsed),
      error: null,
      raw,
      blocked: false,
    };
  } catch (error) {
    return {
      projects: [],
      error: `Ledger could not read saved data. Your original data has been kept. ${error.message}`,
      raw,
      blocked: true,
    };
  }
}

export function saveProjects(projects, storage) {
  try {
    if (!Array.isArray(projects)) return false;
    (storage ?? globalThis.localStorage).setItem(
      storageKey,
      JSON.stringify(projects),
    );
    return true;
  } catch {
    return false;
  }
}

export function loadProjects(storage) {
  return readProjects(storage).projects;
}

export function exportBackup(projects) {
  return JSON.stringify(
    {
      format: "ledger",
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
    },
    null,
    2,
  );
}

export function parseBackup(text) {
  if (typeof text !== "string") throw new Error("Choose a JSON backup file.");
  if (new TextEncoder().encode(text).byteLength > maxBackupBytes)
    throw new Error("Backup must be 5 MB or smaller.");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  assertSafeKeys(parsed);
  if (Array.isArray(parsed))
    return normalizeProjects(parsed, { strict: true, limited: true });
  if (!parsed || parsed.format !== "ledger" || parsed.version !== 1)
    throw new Error("This backup format or version is not supported.");
  return normalizeProjects(parsed.projects, { strict: true, limited: true });
}
