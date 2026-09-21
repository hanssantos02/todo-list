// Entry point — YOU own this file from Lesson 0002 onward.
//
// Strategic rule for this project:
//   - Domain logic (todos, projects) lives in its own modules — NOT here, NOT in DOM code.
//   - This file only wires things together: import styles, import your modules, initial render.
//
// Your next step (Lesson 0001 exercise): do NOT code yet. Design on paper first.
// Leave this file as-is until Lesson 0002 tells you what to create.
import "./styles.css";
import { createProject, addTodoToProject, removeTodoFromProject } from "./project.js";
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
    const activeProject = projects.find(p => p.id === activeId);
    renderTodos(activeProject, {
        onToggle: (todoId) => {
            const todo = activeProject.todos.find(t => t.id === todoId);
            toggleComplete(todo);
            saveProjects(projects);
            draw();
        },
        onDelete: (todoId) => {
            removeTodoFromProject(activeProject, todoId);
            saveProjects(projects);
            draw();
        },
        onEdit: (todoId) => {
            const todo = activeProject.todos.find(t => t.id === todoId);
            const input = prompt("New Priority (low|medium|high):", todo.priority);
            if (input === null) return;
            const v = input.trim().toLowerCase();
            if (!["low", "medium", "high"].includes(v)) {
                alert("Must be low, medium, or high");
                return;
            }
            todo.priority = v;
            saveProjects(projects);
            draw();
        }
    });
}

const form = document.querySelector('#todo-form');

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const active = projects.find(p => p.id === activeId);
    const title = document.querySelector("#todo-title").value;
    const description = document.querySelector("#todo-desc").value;
    const dueDate = document.querySelector("#todo-dueDate").value;
    const priority = document.querySelector("#todo-prio").value;

    try {
        const todo = createTodo({title, description, dueDate, priority});
        addTodoToProject(active, todo);
        saveProjects(projects);
        draw();
        form.reset();
    } catch (err) {
        alert(err.message);
    }
})

const projectForm = document.querySelector("#project-form");

projectForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.querySelector("#project-name").value;

    try {
        const p = createProject(name);
        projects.push(p);
        activeId = p.id;
        saveProjects(projects);
        draw();
        projectForm.reset();
    } catch (err) {
        alert(err.message);
    }   
})
draw();
