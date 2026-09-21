export function createProject(name) {
    if (!name || !name.trim()) {
        throw new Error("Name must not be empty");
    }
    return {
        id: crypto.randomUUID(),
        name: name,
        todos: []
    }
}

export function addTodoToProject(project, todo) {
    project.todos.push(todo);
    return project;
}

export function removeTodoFromProject(project, todoId) {
    const i = project.todos.findIndex(t => t.id === todoId);
    if (i !== -1) project.todos.splice(i, 1);
    return project;
}

export function removeProject(projects, projectId) {
    const i = projects.findIndex(p => p.id === projectId);
    if (i !== -1) projects.splice(i, 1);
    return projects;
}