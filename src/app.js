import { createTodo, updateTodo, toggleComplete } from "./todo.js";
import {
  createProject,
  assertUniqueProjectName,
  addTodoToProject,
  removeTodoFromProject,
  removeProject,
  renameProject,
  moveTodo,
} from "./project.js";
import {
  readProjects,
  saveProjects,
  exportBackup,
  parseBackup,
} from "./storage.js";
import { createStore } from "./store.js";
import {
  allTasks,
  dateStatus,
  localDate,
  prettyDate,
  selectTasks,
} from "./views.js";
import {
  el,
  fillProjects,
  hydrateIcons,
  renderBrief,
  renderNavigation,
  renderTasks,
  renderWeek,
} from "./ui.js";

export function mountApp({ storage, now = () => new Date() } = {}) {
  const $ = (selector) => document.querySelector(selector);
  const initial = readProjects(storage);
  const store = createStore(initial.projects, {
    save: (projects) => saveProjects(projects, storage),
    blocked: initial.blocked,
  });
  const state = {
    view: "today",
    projectId: store.projects[0].id,
    query: "",
    priority: "",
    status: "",
    filterProject: "",
    due: "",
    sort: "due",
    day: "",
  };
  const expanded = new Set();
  const listeners = [];
  const on = (target, event, listener) => {
    target.addEventListener(event, listener);
    listeners.push(() => target.removeEventListener(event, listener));
  };
  let editingId = null,
    renamingId = null,
    focusingId = null,
    confirmCallback = null;
  const recoveryRaw = initial.raw;
  let externalConflict = false,
    storageError = initial.error;
  let pendingImport = 0;
  let captureDateIsDefault = true;
  const returnFocus = new WeakMap();
  const findTask = (id) =>
    allTasks(store.projects).find(({ todo }) => todo.id === id);
  const activeProject = () =>
    store.projects.find((project) => project.id === state.projectId) ||
    store.projects[0];

  function error(id, message) {
    const node = $(id);
    node.textContent = message || "";
    node.hidden = !message;
  }
  function restoreFocus(anchor) {
    if (document.querySelector("dialog[open]")) return;
    if (anchor?.isConnected) {
      anchor.focus();
      return;
    }
    if (anchor?.dataset?.taskId) {
      const replacement = [...document.querySelectorAll("[data-task-id]")].find(
        (node) =>
          node.tagName === "BUTTON" &&
          node.dataset.taskId === anchor.dataset.taskId &&
          node.dataset.action === anchor.dataset.action,
      );
      if (replacement) {
        replacement.focus();
        return;
      }
    }
    $("#capture-title").focus();
  }
  function openDialog(id, focus) {
    const trigger = document.activeElement;
    document
      .querySelectorAll("dialog[open]")
      .forEach((dialog) => dialog.close());
    const dialog = $(id);
    returnFocus.set(dialog, trigger);
    dialog.showModal();
    if (focus) $(focus).focus();
  }
  function notify(message) {
    $("#toast").hidden = false;
    $("#toast-message").textContent = message;
    $("#undo").hidden = !store.undoAvailable;
    $("#undo-lifetime").hidden = !store.undoAvailable;
    $("#announcement").textContent = message;
  }
  function warning() {
    const node = $("#storage-warning");
    node.hidden = !storageError;
    node.replaceChildren();
    if (storageError) {
      node.append(document.createTextNode(`${storageError} `));
      const button = el(
        "button",
        "",
        externalConflict ? "Reload latest ledger" : "Open backup & recovery",
      );
      button.dataset.action = externalConflict ? "reload" : "settings";
      node.append(button);
    }
    $("#export-recovery").hidden = recoveryRaw === null || !initial.blocked;
  }
  function mutate(label, callback) {
    if (externalConflict)
      throw new Error(
        "This ledger changed in another tab. Export a backup, then reload before making changes.",
      );
    try {
      const result = store.mutate(label, callback);
      storageError = null;
      draw();
      notify(label);
      return result;
    } catch (err) {
      if (/save|recover|another tab/i.test(err.message)) {
        storageError = err.message;
        warning();
      }
      throw err;
    }
  }
  function captureContext() {
    const date = $("#capture-date").value;
    const project = store.projects.find(
      (project) => project.id === $("#capture-project").value,
    );
    $("#capture-context").textContent =
      `${project?.name || "Choose a project"} · ${date ? (date === localDate(now()) ? "Due today" : `Due ${prettyDate(date)}`) : "No due date"} · Enter to add`;
  }
  function resetFilters() {
    Object.assign(state, {
      query: "",
      priority: "",
      status: "",
      filterProject: "",
      due: "",
      day: "",
    });
    $("#search").value = "";
    ["priority", "status", "project", "due"].forEach(
      (key) => ($(`#filter-${key}`).value = ""),
    );
  }
  function navigate(view, projectId) {
    state.view = view;
    if (projectId) state.projectId = projectId;
    resetFilters();
    expanded.clear();
    $("#capture-date").value = view === "today" ? localDate(now()) : "";
    captureDateIsDefault = true;
    fillProjects($("#capture-project"), store.projects, activeProject().id);
    const drawer = $("#navigation-dialog");
    if (drawer.open) drawer.close();
    draw();
    $("#view-title").setAttribute("tabindex", "-1");
    $("#view-title").focus();
  }
  function draw() {
    if (!store.projects.some((project) => project.id === state.projectId))
      state.projectId = store.projects[0].id;
    renderNavigation($("#desktop-sidebar"), store.projects, state, now());
    renderNavigation($("#mobile-sidebar"), store.projects, state, now());
    const title = {
      today: "Today",
      upcoming: "Upcoming",
      all: "All Tasks",
      completed: "Completed",
      project: activeProject().name,
    }[state.view];
    $("#view-title").textContent = state.day ? prettyDate(state.day) : title;
    const project = activeProject(),
      projectDone = project.todos.filter((todo) => todo.completed).length;
    const summary = {
      today: "A fresh page. A clear next step.",
      upcoming: "A little perspective on what lies ahead.",
      all: "Everything you’ve set your mind to.",
      completed: "Finished, filed, and off your mind.",
      project: `${project.todos.length - projectDone} remaining · ${projectDone} completed${project.todos.length ? ` · ${Math.round((projectDone / project.todos.length) * 100)}% complete` : ""}`,
    };
    $("#view-summary").textContent = state.day
      ? "Open tasks due on this day, across your projects."
      : summary[state.view];
    $("#project-actions").hidden = state.view !== "project";
    $("#daily-brief").hidden = state.view !== "today" || Boolean(state.day);
    if (!$("#daily-brief").hidden)
      renderBrief($("#daily-brief"), store.projects, now());
    $("#week").hidden =
      !["today", "upcoming"].includes(state.view) && !state.day;
    if (!$("#week").hidden)
      renderWeek($("#week"), store.projects, state.day, now());
    fillProjects(
      $("#capture-project"),
      store.projects,
      $("#capture-project").value || project.id,
    );
    fillProjects(
      $("#filter-project"),
      store.projects,
      state.filterProject,
      true,
    );
    captureContext();
    renderResults();
    const tasks = allTasks(store.projects),
      done = tasks.filter(({ todo }) => todo.completed).length;
    $("#footer-progress").textContent =
      `${done} of ${tasks.length} complete · ${tasks.length - done} remaining`;
    warning();
  }
  function renderResults() {
    const matching = selectTasks(
      store.projects,
      {
        ...state,
        projectId:
          state.view === "project" ? state.projectId : state.filterProject,
        status: state.status,
      },
      localDate(now()),
    );
    const rows = matching.filter(
      ({ todo, project }) =>
        (!state.day || !todo.completed) &&
        (!state.filterProject || project.id === state.filterProject),
    );
    renderTasks($("#tasks"), rows, state, expanded, localDate(now()));
    const count = [
      state.priority,
      state.status,
      state.filterProject,
      state.due,
    ].filter(Boolean).length;
    $("#filter-count").textContent = count ? String(count) : "";
    $("#filter-toggle").setAttribute(
      "aria-label",
      `Filters${count ? `, ${count} active` : ""}`,
    );
    $("#clear-day").hidden = !state.day;
    $("#result-count").textContent =
      `${rows.length} ${rows.length === 1 ? "task" : "tasks"}${state.query ? " matching your search" : state.day ? " on this day" : " in this view"}`;
  }
  function taskEditor(id) {
    const row = findTask(id);
    if (!row) return;
    editingId = id;
    const form = $("#task-form");
    form.reset();
    fillProjects($("#edit-project"), store.projects, row.project.id);
    const todo = row.todo;
    for (const key of ["title", "description", "dueDate", "priority"])
      form.elements[key].value = todo[key] || "";
    $("#task-dialog-title").textContent = "A closer look.";
    $("#delete-task").hidden = !id;
    error("#task-error", "");
    $("#edit-title").removeAttribute("aria-invalid");
    openDialog("#task-dialog", "#edit-title");
  }
  function projectEditor(id) {
    renamingId = id || null;
    $("#project-dialog-title").textContent = id
      ? "Rename project"
      : "A new project.";
    $("#project-name").value = id ? activeProject().name : "";
    $("#project-name").removeAttribute("aria-invalid");
    error("#project-error", "");
    openDialog("#project-dialog", "#project-name");
  }
  function confirm(title, copy, label, callback) {
    $("#confirm-title").textContent = title;
    $("#confirm-copy").textContent = copy;
    $("#confirm-action").textContent = label;
    confirmCallback = callback;
    error("#confirm-error", "");
    openDialog("#confirm-dialog");
  }
  function undo() {
    if (externalConflict) {
      notify("Reload the latest ledger before undoing.");
      return;
    }
    try {
      const label = store.undo();
      if (label) {
        storageError = null;
        draw();
        notify(`Undone: ${label.charAt(0).toLowerCase() + label.slice(1)}`);
        $("#capture-title").focus();
      }
    } catch (err) {
      storageError = err.message;
      warning();
      notify(err.message);
    }
  }
  function download(text, name) {
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const anchor = el("a");
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function settings() {
    error("#data-error", "");
    warning();
    openDialog("#settings-dialog");
  }
  function focusTask(id) {
    const row = findTask(id);
    if (!row) return;
    focusingId = id;
    $("#focus-title").textContent = row.todo.title;
    $("#focus-project").textContent = row.project.name;
    $("#focus-meta").textContent =
      `${prettyDate(row.todo.dueDate)} · ${row.todo.priority} priority`;
    $("#focus-notes").textContent =
      row.todo.description || "No notes. Just a little room to focus.";
    error("#focus-error", "");
    openDialog("#focus-dialog");
  }
  hydrateIcons();
  $("#current-date").textContent = now().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  $("#current-date").dateTime = localDate(now());
  $("#capture-date").value = localDate(now());
  $("#capture-title").setAttribute("aria-describedby", "capture-error");
  $("#edit-title").setAttribute("aria-describedby", "task-error");
  $("#project-name").setAttribute("aria-describedby", "project-error");

  on(document, "click", (event) => {
    const close = event.target.closest("[data-close]");
    if (close) {
      close.closest("dialog").close();
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action,
      id = button.dataset.taskId;
    try {
      if (action === "view") navigate(button.dataset.view);
      else if (action === "project")
        navigate("project", button.dataset.projectId);
      else if (action === "new-task") {
        $("#capture-title").focus();
        $("#capture-title").scrollIntoView({ block: "center" });
      } else if (action === "edit") taskEditor(id);
      else if (action === "notes") {
        expanded.has(id) ? expanded.delete(id) : expanded.add(id);
        draw();
        restoreFocus(button);
      } else if (action === "toggle") {
        const row = findTask(id);
        if (row) {
          mutate(row.todo.completed ? "Task reopened" : "Task completed", () =>
            toggleComplete(row.todo),
          );
          restoreFocus(button);
        }
      } else if (action === "focus") focusTask(id);
      else if (action === "create-project") projectEditor();
      else if (action === "rename-project") projectEditor(activeProject().id);
      else if (action === "delete-project") {
        const project = activeProject();
        confirm(
          `Delete ${project.name}?`,
          `This removes the project and its ${project.todos.length} task${project.todos.length === 1 ? "" : "s"}. You can undo until your next change or reload.`,
          "Delete project",
          () => {
            mutate("Project deleted", (projects) =>
              removeProject(projects, project.id),
            );
          },
        );
      } else if (action === "clear-filters") {
        resetFilters();
        draw();
        $("#search").focus();
      } else if (action === "clear-day") {
        state.day = "";
        draw();
      } else if (action === "day") {
        resetFilters();
        state.day = button.dataset.day;
        state.view = "all";
        $("#capture-date").value = state.day;
        draw();
        restoreFocus(button);
      } else if (action === "settings") settings();
      else if (action === "navigation") {
        renderNavigation($("#mobile-sidebar"), store.projects, state, now());
        openDialog("#navigation-dialog");
      } else if (action === "export")
        download(
          exportBackup(store.projects),
          `ledger-${localDate(now())}.json`,
        );
      else if (action === "export-recovery" && recoveryRaw !== null)
        download(recoveryRaw, `ledger-recovery-${localDate(now())}.json`);
      else if (action === "reload") window.location.reload();
    } catch (err) {
      notify(err.message);
    }
  });
  on($("#capture-date"), "change", () => {
    captureDateIsDefault = false;
    captureContext();
  });
  on($("#capture-project"), "change", captureContext);
  on($("#capture-details"), "click", () => {
    const expanded = $("#capture-options").hidden;
    $("#capture-options").hidden = !expanded;
    $("#capture-details").setAttribute("aria-expanded", String(expanded));
  });
  on($("#capture-title"), "input", () => {
    error("#capture-error", "");
    $("#capture-title").removeAttribute("aria-invalid");
  });
  on($("#capture-form"), "submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const fields = Object.fromEntries(new FormData(form));
      const todo = createTodo(fields);
      const project = store.projects.find(
        (project) => project.id === fields.projectId,
      );
      if (!project) throw new Error("Choose a project for this task.");
      mutate("Task added", () => addTodoToProject(project, todo));
      form.elements.title.value = "";
      form.elements.description.value = "";
      error("#capture-error", "");
      $("#capture-title").removeAttribute("aria-invalid");
      $("#capture-title").focus();
      if (
        state.view === "completed" ||
        state.query ||
        state.priority ||
        state.status ||
        state.due ||
        (state.view === "upcoming" &&
          dateStatus(todo.dueDate) !== "upcoming") ||
        (state.view === "today" &&
          !["overdue", "today"].includes(dateStatus(todo.dueDate)))
      )
        notify("Task added. Find it in All Tasks or its project.");
    } catch (err) {
      error("#capture-error", err.message);
      $("#capture-title").setAttribute("aria-invalid", "true");
      $("#capture-title").focus();
    }
  });
  on($("#task-form"), "submit", (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      mutate("Task updated", (projects) => {
        const row = findTask(editingId);
        if (!row) throw new Error("This task is no longer available.");
        updateTodo(row.todo, fields);
        moveTodo(projects, editingId, fields.projectId);
      });
      $("#task-dialog").close();
    } catch (err) {
      error("#task-error", err.message);
      $("#edit-title").setAttribute("aria-invalid", "true");
      $("#edit-title").focus();
    }
  });
  on($("#delete-task"), "click", () => {
    if (!editingId) return;
    try {
      const row = findTask(editingId);
      if (row) {
        mutate("Task deleted", () =>
          removeTodoFromProject(row.project, editingId),
        );
        $("#task-dialog").close();
      }
    } catch (err) {
      error("#task-error", err.message);
    }
  });
  on($("#project-form"), "submit", (event) => {
    event.preventDefault();
    const name = $("#project-name").value;
    try {
      let id = renamingId;
      mutate(renamingId ? "Project renamed" : "Project created", (projects) => {
        if (renamingId) renameProject(projects, renamingId, name);
        else {
          assertUniqueProjectName(projects, name);
          const project = createProject(name);
          projects.push(project);
          id = project.id;
        }
      });
      $("#project-dialog").close();
      navigate("project", id);
    } catch (err) {
      error("#project-error", err.message);
      $("#project-name").setAttribute("aria-invalid", "true");
      $("#project-name").focus();
    }
  });
  on($("#confirm-action"), "click", () => {
    if (!confirmCallback) return;
    try {
      confirmCallback();
      confirmCallback = null;
      $("#confirm-dialog").close();
    } catch (err) {
      error("#confirm-error", err.message);
    }
  });
  on($("#focus-complete"), "click", () => {
    try {
      const row = findTask(focusingId);
      if (row && !row.todo.completed)
        mutate("Task completed", () => toggleComplete(row.todo));
      $("#focus-dialog").close();
    } catch (err) {
      error("#focus-error", err.message);
    }
  });
  on($("#search"), "input", () => {
    state.query = $("#search").value;
    renderResults();
  });
  on($("#sort"), "change", () => {
    state.sort = $("#sort").value;
    renderResults();
  });
  on($("#filter-toggle"), "click", () => {
    const open = $("#filters").hidden;
    $("#filters").hidden = !open;
    $("#filter-toggle").setAttribute("aria-expanded", String(open));
  });
  on($("#filters"), "submit", (event) => event.preventDefault());
  for (const key of ["priority", "status", "project", "due"])
    on($(`#filter-${key}`), "change", () => {
      state[key === "project" ? "filterProject" : key] = $(
        `#filter-${key}`,
      ).value;
      renderResults();
    });
  on($("#undo"), "click", undo);
  on($("#dismiss-toast"), "click", () => {
    store.dismissUndo();
    $("#toast").hidden = true;
    $("#capture-title").focus();
  });
  document.querySelectorAll("dialog").forEach((dialog) => {
    on(dialog, "close", () => {
      if (dialog.id === "settings-dialog") pendingImport++;
      restoreFocus(returnFocus.get(dialog));
    });
    on(dialog, "click", (event) => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          dialog.close();
      }
    });
  });
  on(document, "keydown", (event) => {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.shiftKey
    )
      return;
    if (
      event.target.closest(
        'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]',
      ) ||
      document.querySelector("dialog[open]")
    )
      return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      if (store.undoAvailable) {
        event.preventDefault();
        undo();
      }
      return;
    }
    if (event.ctrlKey || event.metaKey) return;
    if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      $("#capture-title").focus();
    }
    if (event.key === "/") {
      event.preventDefault();
      $("#search").focus();
    }
  });
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let theme = "system";
  try {
    theme =
      (storage ?? window.localStorage).getItem("ledger-theme") || "system";
  } catch {}
  if (!["system", "light", "dark"].includes(theme)) theme = "system";
  const applyTheme = () => {
    document.documentElement.dataset.theme =
      theme === "system" ? (system.matches ? "dark" : "light") : theme;
  };
  $("#theme").value = theme;
  applyTheme();
  on(system, "change", applyTheme);
  on($("#theme"), "change", () => {
    theme = $("#theme").value;
    applyTheme();
    try {
      (storage ?? window.localStorage).setItem("ledger-theme", theme);
    } catch {
      error(
        "#data-error",
        "Theme changed for this visit. Browser storage is unavailable, so this preference could not be saved.",
      );
    }
  });
  on($("#import-file"), "change", async (event) => {
    const file = event.target.files?.[0],
      token = ++pendingImport;
    event.target.value = "";
    if (!file) return;
    error("#data-error", "");
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Backup must be 5 MB or smaller.");
      const text = await file.text();
      if (token !== pendingImport || !$("#settings-dialog").open) return;
      const projects = parseBackup(text);
      const count = allTasks(projects).length;
      confirm(
        "Replace this ledger?",
        `This backup contains ${projects.length} project${projects.length === 1 ? "" : "s"} and ${count} task${count === 1 ? "" : "s"}. It replaces your current projects and tasks.${initial.blocked ? " Download the original recovery data first if you need it." : " You can undo until your next change or reload."}`,
        "Replace ledger",
        () => {
          if (externalConflict)
            throw new Error(
              "Reload the latest ledger before restoring a backup.",
            );
          store.replace(projects);
          storageError = null;
          state.projectId = store.projects[0].id;
          resetFilters();
          state.view = "all";
          draw();
          notify("Backup restored");
        },
      );
    } catch (err) {
      if (token === pendingImport && $("#settings-dialog").open)
        error("#data-error", err.message);
    }
  });
  on(window, "storage", (event) => {
    if (event.key === "todo-projects" || event.key === null) {
      externalConflict = true;
      store.dismissUndo();
      $("#toast").hidden = true;
      storageError =
        "Ledger changed in another tab. Export your current ledger if needed, then reload to use the latest data.";
      warning();
    }
  });
  let currentDay = localDate(now());
  const refreshDay = () => {
    if (currentDay !== localDate(now())) {
      currentDay = localDate(now());
      if (captureDateIsDefault && state.view === "today" && !state.day)
        $("#capture-date").value = currentDay;
      $("#current-date").textContent = now().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      $("#current-date").dateTime = currentDay;
      draw();
    }
  };
  on(window, "focus", refreshDay);
  on(document, "visibilitychange", refreshDay);
  draw();
  return {
    store,
    state,
    draw,
    destroy() {
      listeners.forEach((remove) => remove());
      pendingImport++;
    },
  };
}
