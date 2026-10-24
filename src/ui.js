import {
  allTasks,
  dateStatus,
  localDate,
  prettyDate,
  sevenDays,
} from "./views.js";

export function el(tag, className = "", text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
const paths = {
  plus: "M12 5v14M5 12h14",
  check: "m5 12 4 4L19 6",
  arrow: "M4 12h15m-5-5 5 5-5 5",
  chevron: "m7 10 5 5 5-5",
  close: "m6 6 12 12M6 18 18 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  today:
    "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  upcoming:
    "M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 9h3m-3 3h6",
  all: "M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01",
  completed: "m8 12 3 3 5-6M21 12a9 9 0 1 1-9-9",
  settings: "M4 7h16M4 17h16M9 4v6m6 4v6",
  search: "m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  filter: "M4 6h16M7 12h10m-7 6h4",
  edit: "m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z",
  trash: "M4 6h16M9 3h6M7 6l1 14h8l1-14M10 10v6m4-6v6",
  focus: "M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M9 12h6m-3-3v6",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  upload: "M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11Zm7 4v2",
  brand: "M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h3",
};
export function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  }))
    svg.setAttribute(key, value);
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[name] || paths.plus);
  svg.append(path);
  return svg;
}
export function actionButton(
  action,
  label,
  iconName,
  className = "button quiet",
) {
  const button = el("button", className);
  button.type = "button";
  button.dataset.action = action;
  button.setAttribute("aria-label", label);
  if (iconName) button.append(icon(iconName));
  return button;
}
export function hydrateIcons(root = document) {
  root
    .querySelectorAll("[data-icon]")
    .forEach((node) => node.replaceWith(icon(node.dataset.icon)));
  root.querySelectorAll("[data-close]").forEach((node) => {
    if (node.classList.contains("icon-button"))
      node.replaceChildren(icon("close"));
  });
  root
    .querySelector('[data-action="navigation"]')
    ?.replaceChildren(icon("menu"));
  root
    .querySelector('[data-action="delete-project"]')
    ?.replaceChildren(icon("trash"));
  root.querySelector("#dismiss-toast")?.replaceChildren(icon("close"));
}
export function fillProjects(select, projects, selected = "", all = false) {
  select.replaceChildren();
  if (all) {
    const option = el("option", "", "All projects");
    option.value = "";
    select.append(option);
  }
  projects.forEach((project) => {
    const option = el("option", "", project.name);
    option.value = project.id;
    select.append(option);
  });
  select.value = projects.some((project) => project.id === selected)
    ? selected
    : all
      ? ""
      : projects[0]?.id || "";
}
export function renderNavigation(container, projects, state, now = new Date()) {
  const content = el("div", "sidebar-content");
  const brand = el("div", "brand");
  const brandText = el("div");
  brandText.append(
    el("div", "brand-name", "Ledger"),
    el("div", "brand-subtitle", "A QUIET TODO"),
  );
  brand.append(icon("brand"), brandText);
  content.append(brand);
  const nav = el("nav", "sidebar-nav");
  nav.setAttribute("aria-label", "Smart views");
  const rows = allTasks(projects);
  const viewCounts = {
    today: rows.filter(({ todo }) =>
      ["today", "overdue"].includes(
        dateStatus(todo.dueDate, todo.completed, localDate(now)),
      ),
    ).length,
    upcoming: rows.filter(
      ({ todo }) =>
        dateStatus(todo.dueDate, todo.completed, localDate(now)) === "upcoming",
    ).length,
    all: rows.length,
    completed: rows.filter(({ todo }) => todo.completed).length,
  };
  for (const [view, label] of Object.entries({
    today: "Today",
    upcoming: "Upcoming",
    all: "All Tasks",
    completed: "Completed",
  })) {
    const button = actionButton("view", label, view, "nav-link");
    button.dataset.view = view;
    if (state.view === view && !state.day)
      button.setAttribute("aria-current", "page");
    button.append(
      el("span", "", label),
      el("span", "nav-count", String(viewCounts[view])),
    );
    nav.append(button);
  }
  content.append(nav);
  const section = el("section", "projects-section");
  const header = el("div", "projects-header");
  header.append(
    el("h2", "", "Projects"),
    actionButton("create-project", "Create project", "plus", "icon-button"),
  );
  const projectNav = el("nav", "projects-list");
  projectNav.setAttribute("aria-label", "Projects");
  projects.forEach((project) => {
    const button = actionButton("project", project.name, null, "project-link");
    button.dataset.projectId = project.id;
    if (state.view === "project" && state.projectId === project.id)
      button.setAttribute("aria-current", "page");
    button.append(
      el("span", "project-dot"),
      el("span", "project-name", project.name),
      el(
        "span",
        "nav-count",
        String(project.todos.filter((todo) => !todo.completed).length),
      ),
    );
    projectNav.append(button);
  });
  section.append(header, projectNav);
  content.append(section);
  const bottom = el("div", "sidebar-bottom");
  const settings = actionButton(
    "settings",
    "Settings & backup",
    "settings",
    "nav-link",
  );
  settings.append(el("span", "", "Settings & backup"));
  const footnote = el("p", "sidebar-footnote");
  footnote.append(
    icon("lock"),
    document.createTextNode("Kept on this device. Yours alone."),
  );
  bottom.append(settings, footnote);
  content.append(bottom);
  container.replaceChildren(content);
}
export function renderBrief(container, projects, now = new Date()) {
  const rows = allTasks(projects),
    today = localDate(now);
  const due = rows.filter(
    ({ todo }) => !todo.completed && todo.dueDate === today,
  ).length;
  const overdue = rows.filter(
    ({ todo }) =>
      dateStatus(todo.dueDate, todo.completed, localDate(now)) === "overdue",
  ).length;
  const completed = rows.filter(({ todo }) => todo.completed).length;
  const hour = now.getHours();
  container.replaceChildren(
    el(
      "h2",
      "",
      `Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}. Here’s your day.`,
    ),
  );
  const counts = el("p", "brief-counts");
  for (const [count, label, cls] of [
    [due, "due today", ""],
    [overdue, "overdue", overdue ? "overdue-count" : ""],
    [completed, "completed in your ledger", ""],
  ]) {
    const part = el("span", cls);
    part.append(
      el("strong", "", String(count)),
      document.createTextNode(` ${label}`),
    );
    counts.append(part);
  }
  container.append(counts);
}
export function renderWeek(container, projects, selected, now = new Date()) {
  container.replaceChildren();
  sevenDays(projects, now).forEach((day) => {
    const button = actionButton(
      "day",
      `${day.label}: ${day.count} open task${day.count === 1 ? "" : "s"}`,
      null,
      "week-day",
    );
    button.dataset.day = day.date;
    button.classList.toggle("is-today", day.date === localDate(now));
    button.classList.toggle("is-selected", day.date === selected);
    button.setAttribute("aria-pressed", String(day.date === selected));
    const numeral = Number(day.date.slice(-2));
    button.append(
      el("span", "", day.day),
      el("strong", "", String(numeral)),
      el(
        "span",
        "day-count",
        `${day.count} ${day.count === 1 ? "task" : "tasks"}`,
      ),
    );
    container.append(button);
  });
}
export function renderTasks(
  container,
  rows,
  state,
  expanded,
  today = localDate(),
) {
  container.replaceChildren();
  if (!rows.length) {
    const empty = el("div", "empty-state");
    const symbol = el("div", "empty-symbol");
    symbol.append(icon("completed"));
    const filtered =
      state.query ||
      state.priority ||
      state.status ||
      state.filterProject ||
      state.due ||
      state.day;
    const title = filtered
      ? "Nothing matches. A little room to reset."
      : state.view === "today"
        ? "A clear page for today."
        : state.view === "completed"
          ? "Good things take a first step."
          : "A little space for what’s next.";
    const copy = filtered
      ? "Try another search or clear your filters to see more of your ledger."
      : state.view === "today"
        ? "No tasks due today or overdue. Capture a thought, or find your next step in All Tasks."
        : state.view === "completed"
          ? "Your completed tasks will be kept here. You can reopen them whenever you need."
          : "Add your first task. A title is all you need to begin.";
    const button = actionButton(
      filtered ? "clear-filters" : "new-task",
      filtered ? "Clear filters" : "Add a task",
      filtered ? null : "plus",
      "button secondary",
    );
    button.append(
      document.createTextNode(filtered ? "Clear filters" : "Add a task"),
    );
    empty.append(symbol, el("h2", "", title), el("p", "", copy), button);
    container.append(empty);
    return;
  }
  const groups = new Map();
  rows.forEach((row) => {
    let key = "Entries";
    if (state.view === "today")
      key =
        dateStatus(row.todo.dueDate, false, today) === "overdue"
          ? "Overdue"
          : "Due today";
    else if (state.view === "upcoming" && state.sort === "due")
      key = prettyDate(row.todo.dueDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  groups.forEach((items, title) => {
    const section = el("section", "task-group");
    if (
      state.view === "today" ||
      (state.view === "upcoming" && state.sort === "due")
    ) {
      const heading = el(
        "h2",
        `task-group-heading${title === "Overdue" ? " overdue" : ""}`,
        title,
      );
      heading.append(el("span", "", String(items.length)));
      section.append(heading);
    }
    const list = el("ul", "task-list");
    items.forEach(({ todo, project }) => {
      const row = el("li", `task-row${todo.completed ? " is-completed" : ""}`);
      row.dataset.taskId = todo.id;
      const check = actionButton(
        "toggle",
        `${todo.completed ? "Reopen" : "Complete"} ${todo.title}`,
        null,
        "task-check",
      );
      check.setAttribute("aria-pressed", String(todo.completed));
      check.dataset.taskId = todo.id;
      const mark = el("span", "check-mark");
      mark.append(icon("check"));
      check.append(mark);
      const main = el("div", "task-main");
      const titleButton = actionButton(
        "edit",
        `Edit ${todo.title}`,
        null,
        "task-title",
      );
      titleButton.textContent = todo.title;
      titleButton.dataset.taskId = todo.id;
      const meta = el("div", "task-meta");
      const dueState = dateStatus(todo.dueDate, todo.completed, today);
      const due = el("span", dueState === "overdue" ? "overdue" : "");
      due.append(
        icon("upcoming"),
        document.createTextNode(
          `${prettyDate(todo.dueDate)}${dueState === "overdue" ? " · overdue" : dueState === "today" ? " · today" : ""}`,
        ),
      );
      meta.append(
        el("span", "", project.name),
        due,
        el(
          "span",
          `priority priority-${todo.priority}`,
          `${todo.priority} priority`,
        ),
      );
      if (todo.completed) meta.append(el("span", "", "Completed"));
      main.append(titleButton, meta);
      const actions = el("div", "task-actions");
      if (todo.description) {
        const notes = actionButton("notes", "Show notes", "all");
        notes.dataset.taskId = todo.id;
        notes.setAttribute("aria-expanded", String(expanded.has(todo.id)));
        notes.append(el("span", "action-word", "Notes"));
        actions.append(notes);
      }
      if (!todo.completed) {
        const focus = actionButton("focus", `Focus on ${todo.title}`, "focus");
        focus.dataset.taskId = todo.id;
        focus.append(el("span", "action-word", "Focus"));
        actions.append(focus);
      }
      const edit = actionButton(
        "edit",
        `Edit details for ${todo.title}`,
        "edit",
        "icon-button",
      );
      edit.dataset.taskId = todo.id;
      actions.append(edit);
      row.append(check, main, actions);
      if (expanded.has(todo.id))
        row.append(el("p", "task-notes", todo.description));
      list.append(row);
    });
    section.append(list);
    container.append(section);
  });
}
