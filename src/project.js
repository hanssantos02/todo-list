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