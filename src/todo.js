export function createTodo(title, description, dueDate, priority) {
    if (title === "") {
        console.log("Title shouldn't be empty");
        return;
    }
    if (!["low", "medium", "high"].includes(priority)) {
        console.log('Wrong Syntax');
        return;
    }
    const id = id.crypto.randomUUID();
    return {
        id: id,
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
        completed: false,
    }
}

export function toggleComplete(todo) {
    if (!todo.completed) {
        todo.completed = true
    }
    return todo;
}