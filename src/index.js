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

const p = createProject("Test Project");
addTodoToProject(p, createTodo({title: "Test", description: "d", dueDate: "2026-09-20", priority: "low"}));
saveProjects([p]);
console.log("loaded count:", loadProjects()[0].todos.length);
