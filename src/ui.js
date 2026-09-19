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


export function renderTodos(project) {
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

        title.textContent = todo.title;
        dueDate.textContent = todo.dueDate;
        priority.textContent = todo.priority;

        li.append(title, dueDate, priority);
        ul.appendChild(li);
    })
    todosContainer.appendChild(ul);
}