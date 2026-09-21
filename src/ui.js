import { format, parseISO, isValid, isBefore, startOfDay } from "date-fns";

function prettyDate(iso) {
  if (!iso) return "No date";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "MMM d, yyyy") : "Invalid date";
}

function isOverdue(iso, completed) {
  if (!iso || completed) return false;
  const d = parseISO(iso);
  if (!isValid(d)) return false;
  return isBefore(d, startOfDay(new Date()));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const ICONS = {
  trash:
    '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M2.5 4h10M6 2.5h3M4 4l.7 8.2a1 1 0 0 0 1 .8h3.6a1 1 0 0 0 1-.8L11 4M6.2 7v3.4M8.8 7v3.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check:
    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.8 7.4l3 3 5.4-6.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  calendar:
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><rect x="1.4" y="2.4" width="9.2" height="8.2" rx="1.6" stroke="currentColor" stroke-width="1.2"/><path d="M1.4 5h9.2M4 1.2v2M8 1.2v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
};

export function renderProjects(projects, activeId, onSelect, onDelete) {
  const container = document.querySelector("#projects");
  const count = document.querySelector("#index-count");
  container.innerHTML = "";
  if (count) count.textContent = String(projects.length);

  if (projects.length === 0) {
    const p = el("p", "project-list-empty", "No projects yet. Name one above to begin.");
    container.appendChild(p);
    return;
  }

  projects.forEach((project) => {
    const row = el("div", "project-row");
    row.setAttribute("role", "listitem");
    if (project.id === activeId) row.classList.add("is-active");

    const select = el("button", "project-select");
    select.type = "button";
    select.setAttribute("aria-current", project.id === activeId ? "true" : "false");

    const name = el("span", "project-name", project.name);
    const badge = el("span", "project-count", String(project.todos.length));
    select.append(name, badge);
    select.addEventListener("click", () => onSelect(project.id));

    const del = el("button", "project-delete");
    del.type = "button";
    del.title = `Delete ${project.name}`;
    del.setAttribute("aria-label", `Delete ${project.name}`);
    del.innerHTML = ICONS.trash;

    let armed = false;
    let timer = null;
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!armed) {
        armed = true;
        del.classList.add("btn-danger-armed");
        del.title = "Click again to confirm";
        del.setAttribute("aria-label", `Confirm delete ${project.name}`);
        timer = setTimeout(() => {
          armed = false;
          del.classList.remove("btn-danger-armed");
          del.title = `Delete ${project.name}`;
        }, 3000);
        return;
      }
      clearTimeout(timer);
      onDelete?.(project.id);
    });

    row.append(select, del);
    container.appendChild(row);
  });
}

export function renderTodos(project, { onToggle, onDelete, onEdit } = {}) {
  const container = document.querySelector("#todos");
  const title = document.querySelector("#project-title");
  const meta = document.querySelector("#project-meta");
  container.innerHTML = "";

  const todos = project?.todos ?? [];
  const open = todos.filter((t) => !t.completed).length;
  const done = todos.length - open;

  if (title) title.textContent = project ? project.name : "Ledger";
  if (meta) meta.textContent = `${open} open · ${done} done`;

  if (!project || todos.length === 0) {
    const empty = el("div", "empty");
    const mark = el("span", "empty-mark");
    mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = ICONS.check;
    const h = el("h2", undefined, project ? `A clear desk in ${project.name}` : "A clear desk");
    const p = el(
      "p",
      undefined,
      "Nothing filed here yet. Add the first entry below"
    );
    empty.append(mark, h, p);
    container.appendChild(empty);
    return;
  }

  const ul = el("ul", "ledger");

  project.todos.forEach((todo) => {
    const li = el("li", "entry");
    if (todo.completed) li.classList.add("is-done");

    const check = el("button", "check");
    check.type = "button";
    check.setAttribute("aria-pressed", todo.completed ? "true" : "false");
    check.setAttribute("aria-label", todo.completed ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`);
    check.innerHTML = ICONS.check;
    check.addEventListener("click", () => onToggle(todo.id));

    const main = el("div", "entry-main");
    const heading = el("strong", "entry-title", todo.title);
    main.appendChild(heading);

    const metaRow = el("div", "entry-meta");

    const due = el("span", "seal seal-due");
    if (isOverdue(todo.dueDate, todo.completed)) due.classList.add("is-overdue");
    due.innerHTML = `${ICONS.calendar}<span>${prettyDate(todo.dueDate)}${isOverdue(todo.dueDate, todo.completed) ? " · overdue" : ""}</span>`;

    const prio = el("span", `seal priority-${todo.priority}`);
    const dot = el("span", "seal-dot");
    dot.setAttribute("aria-hidden", "true");
    const label = el("span", undefined, `${todo.priority[0].toUpperCase()}${todo.priority.slice(1)} priority`);
    prio.append(dot, label);

    const state = el("span", "seal", todo.completed ? "Done" : "Open");
    metaRow.append(due, prio, state);

    const actions = el("div", "entry-actions");

    const detailsBtn = el("button", "btn btn-quiet", todo.description ? "Details" : "Notes");
    detailsBtn.type = "button";
    detailsBtn.setAttribute("aria-expanded", "false");
    if (!todo.description) detailsBtn.disabled = true;

    const editBtn = el("button", "btn btn-quiet", "Edit");
    editBtn.type = "button";

    const delBtn = el("button", "btn btn-quiet", "Delete");
    delBtn.type = "button";
    delBtn.addEventListener("click", () => onDelete(todo.id));

    actions.append(detailsBtn, editBtn, delBtn);

    const details = el("div", "entry-details");
    const detailsInner = el("div");
    const desc = el("p", undefined, todo.description || "No notes filed for this entry.");
    detailsInner.appendChild(desc);
    details.appendChild(detailsInner);

    detailsBtn.addEventListener("click", () => {
      const isOpen = li.classList.toggle("open");
      detailsBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      detailsBtn.textContent = isOpen ? "Hide" : "Details";
    });

    const editor = el("div", "entry-editor");
    editor.hidden = true;
    const field = el("label", "field");
    const fieldLabel = el("span", "field-label", "Priority");
    const select = document.createElement("select");
    ["low", "medium", "high"].forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = `${v[0].toUpperCase()}${v.slice(1)}`;
      if (v === todo.priority) opt.selected = true;
      select.appendChild(opt);
    });
    field.append(fieldLabel, select);

    const save = el("button", "btn btn-primary", "Save priority");
    save.type = "button";
    const cancel = el("button", "btn btn-quiet", "Cancel");
    cancel.type = "button";

    save.addEventListener("click", () => {
      editor.hidden = true;
      editBtn.textContent = "Edit";
      onEdit(todo.id, select.value);
    });
    cancel.addEventListener("click", () => {
      editor.hidden = true;
      editBtn.textContent = "Edit";
      select.value = todo.priority;
    });

    editor.append(field, save, cancel);

    editBtn.addEventListener("click", () => {
      const willOpen = editor.hidden;
      editor.hidden = !willOpen;
      editBtn.textContent = willOpen ? "Close" : "Edit";
      if (willOpen) select.focus();
    });

    li.append(check, main, actions, metaRow, details, editor);
    ul.appendChild(li);
  });

  container.appendChild(ul);
}
