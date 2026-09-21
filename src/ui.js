export function renderProjects(projects, activeId, onSelect) {
    const projectContainer = document.querySelector('#projects');
    projectContainer.innerHTML = "";

    projects.forEach((project) => {
        const projectBtn = document.createElement('button');
        projectBtn.textContent = `${project.name} #${project.todos.length}`;

        projectBtn.addEventListener("click", () => onSelect(project.id));

        projectContainer.appendChild(projectBtn);

        if (project.id === activeId) {
            projectBtn.classList.add('active');
        }
    })
}


export function renderTodos(project, { onToggle, onDelete, onEdit } = {}) {
    const todosContainer = document.querySelector('#todos');
    const ul = document.createElement('ul');
    todosContainer.innerHTML = "";

    if (!project || project.todos.length === 0) {
        const p = document.createElement('p');
        p.textContent = "No todos yet";
        todosContainer.appendChild(p);
        return;
    }
    

    project.todos.forEach((todo) => {
        const li = document.createElement('li');
        const title = document.createElement('strong');
        const dueDate = document.createElement("span");
        const priority = document.createElement("span");
        const expandBtn = document.createElement("button");
        const detailsDiv = document.createElement("div");
        const todoDesc = document.createElement("p");
        const doneBtn = document.createElement("button");
        const delBtn = document.createElement("button");
        const editBtn = document.createElement("button");

        title.textContent = todo.title;
        if (todo.completed) title.style.textDecoration = "line-through";
        dueDate.textContent = todo.dueDate;
        priority.textContent = todo.priority;
        priority.classList.add('priority', `priority-${todo.priority}`);
        expandBtn.textContent = "Details"
        todoDesc.textContent = todo.description ? todo.description : "(No description)";
        doneBtn.textContent = todo.completed ? "Undo" : "Done";
        delBtn.textContent = "Delete";
        editBtn.textContent = "Edit";
        detailsDiv.style.display = "none";

        doneBtn.addEventListener("click", () => onToggle(todo.id));
        delBtn.addEventListener("click", () => onDelete(todo.id));
        editBtn.addEventListener("click", () => onEdit(todo.id));
        expandBtn.addEventListener("click", () => {
            const open = detailsDiv.style.display === "none";
            detailsDiv.style.display = open ? "block" : "none";
            expandBtn.textContent = open ? "Hide" : "Details";
        })

        detailsDiv.appendChild(todoDesc);
        li.append(title, detailsDiv, dueDate, priority, expandBtn, doneBtn, delBtn, editBtn);
        ul.appendChild(li);
    })
    todosContainer.appendChild(ul);
}