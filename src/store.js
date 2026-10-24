import { createProject } from "./project.js";

const clone = (value) => structuredClone(value);
const saveError = () =>
  new Error(
    "Ledger could not save this change. Your previous data is still in place. Try exporting a backup or freeing browser storage.",
  );

export function createStore(
  initialProjects,
  { save = () => true, blocked = false } = {},
) {
  let projects = clone(initialProjects);
  let undoState = null;
  const ensureProject = () => {
    if (!projects.length) projects.push(createProject("Default"));
  };
  ensureProject();

  function persist() {
    try {
      if (save(projects) !== true) throw saveError();
    } catch {
      throw saveError();
    }
  }

  return {
    get projects() {
      return projects;
    },
    get undoAvailable() {
      return undoState !== null;
    },
    mutate(label, callback) {
      if (blocked)
        throw new Error(
          "Saved data needs recovery before changes can be made. Export the original data or restore a validated backup in Settings.",
        );
      const before = clone(projects);
      try {
        const result = callback(projects);
        ensureProject();
        persist();
        undoState = { projects: before, label };
        return result;
      } catch (error) {
        projects = before;
        throw error;
      }
    },
    undo() {
      if (!undoState) return false;
      const current = projects;
      const previous = undoState;
      projects = clone(previous.projects);
      try {
        persist();
        undoState = null;
        return previous.label;
      } catch (error) {
        projects = current;
        throw error;
      }
    },
    dismissUndo() {
      undoState = null;
    },
    // Caller validates the import and confirms replacement before invoking this.
    replace(replacement, label = "Backup restored") {
      const before = projects;
      projects = clone(replacement);
      try {
        ensureProject();
        persist();
        undoState = blocked ? null : { projects: before, label };
        blocked = false;
      } catch (error) {
        projects = before;
        throw error;
      }
    },
  };
}
