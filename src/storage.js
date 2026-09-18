export function saveProjects(projects) {
    if (projects === undefined) {
        console.error("Cannot save projects data");
        return false;
    }

    try {
        localStorage.setItem('todo-projects', JSON.stringify(projects));
        return true;
    } 
    catch (error) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            console.error("Storage Full! Could not save projects.", error.message);
        }
        else {
            console.error("Failed to save projects to localStorage:", error.message);
        }
        return false;
    }
}

export function loadProjects() {
    const raw = localStorage.getItem('todo-projects');
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed: [];
    } catch {
        return [];
    }
}