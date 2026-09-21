// Entry point — wires domain modules to the ledger interface.
import "./styles.css";
import { format } from "date-fns";
import { createProject, addTodoToProject, removeTodoFromProject, removeProject } from "./project.js";
import { createTodo, toggleComplete } from "./todo.js";
import { saveProjects, loadProjects } from "./storage.js";
import { renderProjects, renderTodos } from "./ui.js";

let projects = loadProjects();
if (projects.length === 0) {
  projects = [createProject("Default")];
  saveProjects(projects);
}

let activeId = projects[0].id;

function showError(id, message) {
  const node = document.querySelector(id);
  if (!node) {
    alert(message);
    return;
  }
  node.textContent = message;
  node.hidden = false;
}

function clearError(id) {
  const node = document.querySelector(id);
  if (node) {
    node.textContent = "";
    node.hidden = true;
  }
}

function updateChrome() {
  const date = document.querySelector("#masthead-date");
  if (date) date.textContent = format(new Date(), "EEEE, MMM d");

  const total = projects.reduce((n, p) => n + p.todos.length, 0);
  const done = projects.reduce((n, p) => n + p.todos.filter((t) => t.completed).length, 0);
  const progress = document.querySelector("#masthead-progress");
  if (progress) progress.textContent = total === 0 ? "nothing filed" : `${done} of ${total} clear`;

  const colophon = document.querySelector("#colophon-count");
  if (colophon) colophon.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;
}

function draw() {
  renderProjects(
    projects,
    activeId,
    (id) => {
      activeId = id;
      draw();
    },
    (delId) => {
      removeProject(projects, delId);
      if (projects.length === 0) projects.push(createProject("Default"));
      if (activeId === delId) activeId = projects[0].id;
      saveProjects(projects);
      draw();
    }
  );

  const activeProject = projects.find((p) => p.id === activeId);
  renderTodos(activeProject, {
    onToggle: (todoId) => {
      const todo = activeProject.todos.find((t) => t.id === todoId);
      toggleComplete(todo);
      saveProjects(projects);
      draw();
    },
    onDelete: (todoId) => {
      removeTodoFromProject(activeProject, todoId);
      saveProjects(projects);
      draw();
    },
    onEdit: (todoId, nextPriority) => {
      const todo = activeProject.todos.find((t) => t.id === todoId);
      if (nextPriority !== undefined) {
        const v = String(nextPriority).trim().toLowerCase();
        if (!["low", "medium", "high"].includes(v)) {
          showError("#todo-error", "Priority must be low, medium, or high.");
          return;
        }
        todo.priority = v;
        saveProjects(projects);
        draw();
        return;
      }
      const input = prompt("New Priority (low|medium|high):", todo.priority);
      if (input === null) return;
      const v = input.trim().toLowerCase();
      if (!["low", "medium", "high"].includes(v)) {
        showError("#todo-error", "Priority must be low, medium, or high. Nothing was changed.");
        return;
      }
      todo.priority = v;
      saveProjects(projects);
      draw();
    },
  });

  updateChrome();
}

const form = document.querySelector("#todo-form");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearError("#todo-error");

  const active = projects.find((p) => p.id === activeId);
  const title = document.querySelector("#todo-title").value;
  const description = document.querySelector("#todo-desc").value;
  const dueDate = document.querySelector("#todo-dueDate").value;
  const priority = document.querySelector("#todo-prio").value;

  try {
    const todo = createTodo({ title, description, dueDate, priority });
    addTodoToProject(active, todo);
    saveProjects(projects);
    draw();
    form.reset();
    document.querySelector("#todo-title")?.focus();
  } catch (err) {
    showError("#todo-error", `${err.message}. Give the entry a title to file it.`);
  }
});

const projectForm = document.querySelector("#project-form");

projectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearError("#project-error");

  const name = document.querySelector("#project-name").value;

  try {
    const p = createProject(name);
    projects.push(p);
    activeId = p.id;
    saveProjects(projects);
    draw();
    projectForm.reset();
  } catch (err) {
    showError("#project-error", `${err.message}. Name the project to add it to the index.`);
  }
});

["#project-name", "#todo-title"].forEach((sel) => {
  document.querySelector(sel)?.addEventListener("input", () => {
    clearError(sel === "#project-name" ? "#project-error" : "#todo-error");
  });
});

draw();
