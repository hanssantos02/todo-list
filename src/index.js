// Entry point — YOU own this file from Lesson 0002 onward.
//
// Strategic rule for this project:
//   - Domain logic (todos, projects) lives in its own modules — NOT here, NOT in DOM code.
//   - This file only wires things together: import styles, import your modules, initial render.
//
// Your next step (Lesson 0001 exercise): do NOT code yet. Design on paper first.
// Leave this file as-is until Lesson 0002 tells you what to create.
import "./styles.css";
import { createProject, addTodoToProject } from "./project.js";
import { createTodo, toggleComplete } from "./todo.js";
import { saveProjects, loadProjects } from "./storage.js";
import { renderProjects, renderTodos } from "./ui.js";

let projects = loadProjects();
if (projects.length === 0) {
    projects = [createProject("Default")];
    saveProjects(projects);
}

let activeId = projects[0].id;

renderProjects(projects, activeId, (id) => {
    activeId = id;
    draw();
});

function draw() {
    renderProjects(projects, activeId, (id) => {
    activeId = id;
    draw();
    });
    renderTodos(projects.find(p => p.id === activeId));
}
draw();
