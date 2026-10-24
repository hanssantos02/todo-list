const priorities = ["low", "medium", "high"];

// Calendar arithmetic keeps date-only task values independent of UTC and DST.
export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
  );
}

function validateFields({ title, description, dueDate, priority }) {
  if (typeof title !== "string" || !title.trim())
    throw new Error("Title must not be empty.");
  if (typeof description !== "string")
    throw new Error("Description must be text.");
  if (dueDate !== "" && !isValidDate(dueDate))
    throw new Error("Choose a valid due date.");
  if (!priorities.includes(priority))
    throw new Error("Priority must be low, medium, or high.");
  return { title: title.trim(), description, dueDate, priority };
}

export function createTodo({
  title,
  description = "",
  dueDate = "",
  priority = "medium",
}) {
  return {
    id: crypto.randomUUID(),
    ...validateFields({ title, description, dueDate, priority }),
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export function updateTodo(todo, fields) {
  const candidate = {};
  for (const key of ["title", "description", "dueDate", "priority"]) {
    candidate[key] = Object.hasOwn(fields, key)
      ? fields[key]
      : (todo[key] ?? (key === "priority" ? "medium" : ""));
  }
  Object.assign(todo, validateFields(candidate));
  return todo;
}

export function toggleComplete(todo) {
  todo.completed = !todo.completed;
  return todo;
}
