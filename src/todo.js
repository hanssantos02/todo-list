export function createTodo({ title, description, dueDate, priority }) {
    if (!title || !title.trim()) {
        throw new Error("Title must not be empty");
    }
    if (!["low", "medium", "high"].includes(priority)) {
        throw new Error("Priority must be low, medium, or high");
    }
    return {
        id: crypto.randomUUID(),
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
        completed: false,
    }
}

export function toggleComplete(todo) {
    todo.completed = !todo.completed;
    return todo;
}