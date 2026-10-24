function validName(name) {
  if (typeof name !== "string" || !name.trim())
    throw new Error("Project name must not be empty.");
  return name.trim();
}

export function createProject(name) {
  return { id: crypto.randomUUID(), name: validName(name), todos: [] };
}

export function addTodoToProject(project, todo) {
  if (project.todos.some((item) => item.id === todo.id))
    throw new Error("This task is already in the project.");
  project.todos.push(todo);
  return project;
}

export function removeTodoFromProject(project, todoId) {
  const index = project.todos.findIndex((todo) => todo.id === todoId);
  if (index !== -1) project.todos.splice(index, 1);
  return project;
}

export function removeProject(projects, projectId) {
  const index = projects.findIndex((project) => project.id === projectId);
  if (index !== -1) projects.splice(index, 1);
  return projects;
}

export function assertUniqueProjectName(projects, name, excludingId) {
  const normalized = validName(name);
  if (
    projects.some(
      (item) =>
        item.id !== excludingId &&
        item.name.trim().toLocaleLowerCase() === normalized.toLocaleLowerCase(),
    )
  ) {
    throw new Error("A project with this name already exists.");
  }
}

export function renameProject(projects, id, name) {
  const normalized = validName(name);
  const project = projects.find((item) => item.id === id);
  if (!project) throw new Error("Project could not be found.");
  assertUniqueProjectName(projects, name, id);
  project.name = normalized;
  return project;
}

export function moveTodo(projects, todoId, targetProjectId) {
  const target = projects.find((project) => project.id === targetProjectId);
  if (!target) throw new Error("Choose an existing project.");
  const sources = projects.filter((project) =>
    project.todos.some((todo) => todo.id === todoId),
  );
  const matches = sources.flatMap((project) =>
    project.todos.filter((todo) => todo.id === todoId),
  );
  if (matches.length !== 1) throw new Error("Task could not be moved safely.");
  if (sources[0] !== target) {
    removeTodoFromProject(sources[0], todoId);
    addTodoToProject(target, matches[0]);
  }
  return matches[0];
}
