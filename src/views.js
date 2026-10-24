import { isValidDate } from "./todo.js";

export function localDate(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateStatus(iso, completed = false, today = localDate()) {
  if (completed) return "completed";
  if (!isValidDate(iso)) return "undated";
  return iso < today ? "overdue" : iso === today ? "today" : "upcoming";
}

function calendarDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function prettyDate(iso) {
  if (!isValidDate(iso)) return "No due date";
  return calendarDate(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function allTasks(projects) {
  return projects.flatMap((project) =>
    project.todos.map((todo) => ({ todo, project })),
  );
}

export function selectTasks(projects, options = {}, today = localDate()) {
  const {
    view = "today",
    projectId = "",
    query = "",
    priority = "",
    status = "",
    due = "",
    sort = "due",
    day = "",
  } = options;
  const search = query.trim().toLocaleLowerCase();
  const rows = allTasks(projects).filter(({ todo, project }) => {
    const date = dateStatus(todo.dueDate, false, today);
    if (
      view === "today" &&
      (todo.completed || !["today", "overdue"].includes(date))
    )
      return false;
    if (view === "upcoming" && (todo.completed || date !== "upcoming"))
      return false;
    if (view === "completed" && !todo.completed) return false;
    if (projectId && project.id !== projectId) return false;
    if (priority && todo.priority !== priority) return false;
    if (status === "open" && todo.completed) return false;
    if (status === "completed" && !todo.completed) return false;
    if (due && date !== due) return false;
    if (day && todo.dueDate !== day) return false;
    return (
      !search ||
      `${todo.title}\n${todo.description || ""}`
        .toLocaleLowerCase()
        .includes(search)
    );
  });
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const compareDue = (a, b) =>
    (isValidDate(a.dueDate) ? a.dueDate : "9999-99-99").localeCompare(
      isValidDate(b.dueDate) ? b.dueDate : "9999-99-99",
    );
  return rows.sort((a, b) => {
    if (sort === "priority")
      return (
        (priorityOrder[a.todo.priority] ?? 1) -
          (priorityOrder[b.todo.priority] ?? 1) || compareDue(a.todo, b.todo)
      );
    if (sort === "title") return a.todo.title.localeCompare(b.todo.title);
    if (sort === "created") return 0;
    return compareDue(a.todo, b.todo);
  });
}

export function sevenDays(projects, todayDate = new Date()) {
  const tasks = allTasks(projects).filter(({ todo }) => !todo.completed);
  const today = localDate(todayDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayDate);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const iso = localDate(date);
    return {
      date: iso,
      label: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      day: date.toLocaleDateString(undefined, { weekday: "short" }),
      count: tasks.filter(({ todo }) => todo.dueDate === iso).length,
      overdue:
        index === 0
          ? tasks.filter(
              ({ todo }) =>
                dateStatus(todo.dueDate, false, today) === "overdue",
            ).length
          : 0,
    };
  });
}
