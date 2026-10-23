/* =========================================================
   ARDANARX SYSTEM
   Admin Workspace
   Static HTML + Supabase
   ========================================================= */

const SUPABASE_URL = "https://isqimtsaeuvceijapddj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SrJsbjs-_hunnBhCTlKywA_JxtScx3t";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let currentUser = null;
let allNotes = [];
let allProjects = [];
let allMedia = [];
let allMessages = [];

let currentNoteFilter = "all";
let currentProjectFilter = "all";

let editingNoteId = null;
let editingProjectId = null;

let slugManuallyEdited = false;
let projectSlugManuallyEdited = false;

let notificationTimer = null;
let savedEditorRange = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const loginScreen = $("#loginScreen");
const appShell = $("#appShell");
const loginForm = $("#loginForm");
const loginEmail = $("#loginEmail");
const loginPassword = $("#loginPassword");
const loginButton = $("#loginButton");
const loginMessage = $("#loginMessage");
const logoutButton = $("#logoutButton");

const sidebar = $("#sidebar");
const sidebarOverlay = $("#sidebarOverlay");
const mobileMenuButton = $("#mobileMenuButton");
const closeSidebarButton = $("#closeSidebar");

const notification = $("#notification");
const notificationMessage = $("#notificationMessage");

const noteModal = $("#noteModal");
const noteModalBackdrop = $("#noteModalBackdrop");
const noteForm = $("#noteForm");
const noteEditorEyebrow = $("#noteEditorEyebrow");
const noteEditorTitle = $("#noteEditorTitle");
const closeNoteModal = $("#closeNoteModal");
const cancelNote = $("#cancelNote");
const noteTitle = $("#noteTitle");
const noteSlug = $("#noteSlug");
const noteExcerpt = $("#noteExcerpt");
const noteContentEditor = $("#noteContentEditor");
const noteContent = $("#noteContent");
const noteStatus = $("#noteStatus");
const saveNoteButton = $("#saveNoteButton");
const editorLinkButton = $("#editorLinkButton");
const editorImageButton = $("#editorImageButton");
const noteEditorImageInput = $("#noteEditorImageInput");

const recentNotesList = $("#recentNotesList");
const managementNotesList = $("#managementNotesList");
const notesStat = $("#notesStat");
const publishedStat = $("#publishedStat");
const notesManagementCount = $("#notesManagementCount");

const projectModal = $("#projectModal");
const projectModalBackdrop = $("#projectModalBackdrop");
const projectForm = $("#projectForm");
const projectEditorEyebrow = $("#projectEditorEyebrow");
const projectEditorTitle = $("#projectEditorTitle");
const closeProjectModal = $("#closeProjectModal");
const cancelProject = $("#cancelProject");
const projectTitle = $("#projectTitle");
const projectSlug = $("#projectSlug");
const projectDescription = $("#projectDescription");
const projectContentEditor = $("#projectContentEditor");
const projectContent = $("#projectContent");
const projectEditorImageButton = $("#projectEditorImageButton");
const projectEditorImageInput = $("#projectEditorImageInput");
const projectThumbnail = $("#projectThumbnail");
const projectTechStack = $("#projectTechStack");
const projectUrl = $("#projectUrl");
const projectGithubUrl = $("#projectGithubUrl");
const projectStatus = $("#projectStatus");
const projectFeatured = $("#projectFeatured");
const projectSortOrder = $("#projectSortOrder");
const saveProjectButton = $("#saveProjectButton");

const projectsStat = $("#projectsStat");
const managementProjectsList = $("#managementProjectsList");
const projectsManagementCount = $("#projectsManagementCount");

const overviewPage = $("#overviewPage");
const notesManagement = $("#notesManagement");
const projectsManagement = $("#projectsManagement");
const mediaManagement = $("#mediaManagement");
const messagesManagement = $("#messagesManagement");
const settingsManagement = $("#settingsManagement");

const mediaList = $("#mediaList");
const mediaSearch = $("#mediaSearch");
const mediaUploadButton = $("#mediaUploadButton");
const mediaFileInput = $("#mediaFileInput");

const messagesList = $("#messagesList");
const messageSearch = $("#messageSearch");

const settingsForm = $("#settingsForm");
const settingsEmail = $("#settingsEmail");
const settingsName = $("#settingsName");
const settingsSiteUrl = $("#settingsSiteUrl");
const settingsNotifications = $("#settingsNotifications");

const PAGE_ELEMENTS = {
    overview: overviewPage,
    notes: notesManagement,
    projects: projectsManagement,
    media: mediaManagement,
    messages: messagesManagement,
    settings: settingsManagement
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
    bindLoginEvents();
    bindNavigationEvents();
    bindSidebarEvents();
    bindNoteEvents();
    bindProjectEvents();
    bindEditorEvents();
    bindProjectEditorEvents();
    bindMediaEvents();
    bindMessageEvents();
    bindSettingsEvents();

    updateCurrentDate();
    showLoginScreen();

    const { data } = await supabaseClient.auth.getSession();
    currentUser = data?.session?.user || null;

    if (currentUser) {
        await showApplication();
    }
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;

    if (currentUser) {
        showApplication();
    } else {
        showLoginScreen();
    }
});

/* =========================================================
   AUTH
========================================================= */

function bindLoginEvents() {
    if (!loginForm) return;

    loginForm.addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
    event.preventDefault();

    const email = loginEmail?.value.trim();
    const password = loginPassword?.value;

    if (!email || !password) {
        showLoginMessage("Please enter your email and password.");
        return;
    }

    setLoginLoading(true);
    showLoginMessage("");

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showLoginMessage(getFriendlySupabaseError(error));
        setLoginLoading(false);
        return;
    }

    setLoginLoading(false);
}

async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        showNotification(getFriendlySupabaseError(error), "error");
        return;
    }

    currentUser = null;
    showLoginScreen();
}

function showApplication() {
    if (loginScreen) loginScreen.hidden = true;
    if (appShell) appShell.hidden = false;

    if (settingsEmail) settingsEmail.value = currentUser?.email || "";

    loadDashboard().catch((error) => {
        console.error(error);
        showNotification("Some dashboard data could not be loaded.", "error");
    });
}

function showLoginScreen() {
    if (loginScreen) loginScreen.hidden = false;
    if (appShell) appShell.hidden = true;
    closeMobileSidebar();
}

function showLoginMessage(message) {
    if (loginMessage) loginMessage.textContent = message || "";
}

function setLoginLoading(loading) {
    if (!loginButton) return;
    loginButton.disabled = loading;
    loginButton.textContent = loading ? "Signing in..." : "Sign in";
}

/* =========================================================
   NAVIGATION
========================================================= */

function bindNavigationEvents() {
    $$("[data-page-link]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            navigateTo(link.dataset.pageLink);
        });
    });

    $$("[data-overview-project]").forEach((item) => {
        item.addEventListener("click", () => navigateTo("projects"));
    });
}

function navigateTo(page) {
    if (!PAGE_ELEMENTS[page]) return;

    Object.entries(PAGE_ELEMENTS).forEach(([key, element]) => {
        if (!element) return;
        const active = key === page;
        element.hidden = !active;
        element.classList.toggle("active", active);
    });

    $$("[data-page-link]").forEach((link) => {
        link.classList.toggle(
            "active",
            link.dataset.pageLink === page
        );
    });

    if (page === "overview") updateOverviewStats();
    if (page === "notes") renderManagementNotes();
    if (page === "projects") renderManagementProjects();
    if (page === "media") { loadMedia(); renderMedia(); }
    if (page === "messages") { loadMessages(); renderMessages(); }

    closeMobileSidebar();
}

function bindSidebarEvents() {
    logoutButton?.addEventListener("click", handleLogout);

    mobileMenuButton?.addEventListener("click", openMobileSidebar);
    sidebarOverlay?.addEventListener("click", closeMobileSidebar);
    closeSidebarButton?.addEventListener("click", closeMobileSidebar);
}

function openMobileSidebar() {
    sidebar?.classList.add("open");
    sidebarOverlay?.classList.add("active");
    document.body.classList.add("sidebar-open");
}

function closeMobileSidebar() {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("active");
    document.body.classList.remove("sidebar-open");
}

/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {
    await Promise.all([
        loadNotes(),
        loadProjects()
    ]);

    updateOverviewStats();
    renderRecentNotes();
    renderOverviewProjects();
}

function updateCurrentDate() {
    const element = $("#currentDate");
    if (!element) return;

    element.textContent = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(new Date());
}

/* =========================================================
   NOTES
========================================================= */

function bindNoteEvents() {
    $("#newNoteButton")?.addEventListener("click", openNewNote);
    $("#managementNewNoteButton")?.addEventListener("click", openNewNote);

    noteForm?.addEventListener("submit", handleNoteSubmit);
    cancelNote?.addEventListener("click", closeNoteEditor);
    closeNoteModal?.addEventListener("click", closeNoteEditor);
    noteModalBackdrop?.addEventListener("click", closeNoteEditor);

    noteTitle?.addEventListener("input", generateSlugFromTitle);
    noteSlug?.addEventListener("input", handleManualSlugInput);

    $$("[data-note-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            currentNoteFilter = button.dataset.noteFilter || "all";
            updateNoteFilterButtons();
            renderManagementNotes();
        });
    });
}

async function loadNotes() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        renderManagementNotesError(error);
        return;
    }

    allNotes = data || [];
}

function updateNoteFilterButtons() {
    $$("[data-note-filter]").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.noteFilter === currentNoteFilter
        );
    });
}

function renderManagementNotes() {
    if (!managementNotesList) return;

    const notes = currentNoteFilter === "all"
        ? allNotes
        : allNotes.filter((note) => note.status === currentNoteFilter);

    if (notesManagementCount) {
        notesManagementCount.textContent =
            `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
    }

    if (!notes.length) {
        managementNotesList.innerHTML = `
            <div class="management-empty">
                <p class="eyebrow">Notes</p>
                <h3>No notes found</h3>
                <p>Create your first note to get started.</p>
            </div>
        `;
        return;
    }

    managementNotesList.innerHTML = notes
        .map(createNoteManagementCard)
        .join("");

    bindNoteCardActions();
}

function renderManagementNotesError(error) {
    if (!managementNotesList) return;

    managementNotesList.innerHTML = `
        <div class="management-empty">
            <p class="eyebrow">Notes</p>
            <h3>Unable to load notes</h3>
            <p>${escapeHtml(getFriendlySupabaseError(error))}</p>
        </div>
    `;
}

function createNoteManagementCard(note) {
    const date = note.updated_at || note.created_at;

    return `
        <article class="management-note-card">
            <div class="management-note-main">
                <p class="eyebrow">${escapeHtml(note.status || "draft")}</p>
                <h3>${escapeHtml(note.title || "Untitled")}</h3>
                <p>${escapeHtml(note.excerpt || stripHtml(note.content || "").slice(0, 160))}</p>
                <span>${formatDate(date)}</span>
            </div>

            <div class="management-note-actions">
                <button type="button" class="admin-small-button" data-edit-note="${escapeAttribute(note.id)}">
                    Edit
                </button>

                <button type="button" class="admin-small-button danger" data-delete-note="${escapeAttribute(note.id)}">
                    Delete
                </button>
            </div>
        </article>
    `;
}

function bindNoteCardActions() {
    $$("[data-edit-note]").forEach((button) => {
        button.addEventListener("click", () => {
            openEditNote(button.dataset.editNote);
        });
    });

    $$("[data-delete-note]").forEach((button) => {
        button.addEventListener("click", () => {
            deleteNote(button.dataset.deleteNote);
        });
    });
}

function renderRecentNotes() {
    if (!recentNotesList) return;

    const notes = allNotes
        .filter((note) => note.status === "published")
        .slice(0, 4);

    if (!notes.length) {
        recentNotesList.innerHTML = `
            <div class="management-empty">
                <p class="eyebrow">Notes</p>
                <h3>No published notes yet</h3>
                <p>Published notes will appear here.</p>
            </div>
        `;
        return;
    }

    recentNotesList.innerHTML = notes.map(createRecentNoteItem).join("");
    bindNoteCardActions();
}

function createRecentNoteItem(note) {
    return `
        <button type="button" class="overview-recent-item" data-edit-note="${escapeAttribute(note.id)}">
            <span class="overview-recent-copy">
                <strong>${escapeHtml(note.title || "Untitled")}</strong>
                <small>${escapeHtml(note.excerpt || stripHtml(note.content || "") || "Note")}</small>
            </span>
            <time>${formatDate(note.published_at || note.created_at)}</time>
        </button>
    `;
}

function openNewNote() {
    editingNoteId = null;
    slugManuallyEdited = false;

    if (noteForm) noteForm.reset();

    if (noteEditorEyebrow) noteEditorEyebrow.textContent = "New Note";
    if (noteEditorTitle) noteEditorTitle.textContent = "Create a note";
    if (saveNoteButton) saveNoteButton.textContent = "Save Note";

    if (noteContentEditor) noteContentEditor.innerHTML = "";
    if (noteContent) noteContent.value = "";

    openModal(noteModal);
    noteTitle?.focus();
}

function openEditNote(id) {
    const note = allNotes.find((item) => item.id === id);
    if (!note) return;

    editingNoteId = note.id;

    const generated = slugify(note.title || "");
    slugManuallyEdited = Boolean(note.slug && note.slug !== generated);

    if (noteEditorEyebrow) noteEditorEyebrow.textContent = "Edit Note";
    if (noteEditorTitle) noteEditorTitle.textContent = "Update your note";
    if (saveNoteButton) saveNoteButton.textContent = "Save Changes";

    if (noteTitle) noteTitle.value = note.title || "";
    if (noteSlug) noteSlug.value = note.slug || "";
    if (noteExcerpt) noteExcerpt.value = note.excerpt || "";
    if (noteStatus) noteStatus.value = note.status || "draft";
    if (noteContentEditor) noteContentEditor.innerHTML = sanitizeHtml(note.content || "");
    syncNoteEditorContent();

    openModal(noteModal);
    noteTitle?.focus();
}

function slugify(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}

function generateSlugFromTitle() {
    if (!noteSlug || slugManuallyEdited) return;
    noteSlug.value = slugify(noteTitle?.value || "");
}

function handleManualSlugInput() {
    if (!noteSlug) return;
    slugManuallyEdited = true;
    noteSlug.value = slugify(noteSlug.value);
}

async function handleNoteSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
        showNotification("Please sign in first.", "error");
        return;
    }

    syncNoteEditorContent();

    const title = noteTitle?.value.trim();
    const slug = noteSlug?.value.trim() || slugify(title);
    const excerpt = noteExcerpt?.value.trim() || null;
    const content = noteContent?.value || "";
    const status = noteStatus?.value || "draft";

    if (!title || !slug) {
        showNotification("Title and slug are required.", "error");
        return;
    }

    setNoteSaving(true);

    const existing = editingNoteId
        ? allNotes.find((note) => note.id === editingNoteId)
        : null;

    const payload = {
        title,
        slug,
        excerpt,
        content,
        status,
        published_at: status === "published"
            ? (existing?.published_at || new Date().toISOString())
            : null
    };

    let result;

    if (editingNoteId) {
        result = await supabaseClient
            .from("notes")
            .update(payload)
            .eq("id", editingNoteId)
            .select()
            .single();
    } else {
        result = await supabaseClient
            .from("notes")
            .insert(payload)
            .select()
            .single();
    }

    if (result.error) {
        setNoteSaving(false);
        showNotification(getFriendlySupabaseError(result.error), "error");
        return;
    }

    if (editingNoteId) {
        allNotes = allNotes.map((note) =>
            note.id === editingNoteId ? result.data : note
        );
    } else {
        allNotes.unshift(result.data);
    }

    setNoteSaving(false);
    closeNoteEditor();
    renderManagementNotes();
    renderRecentNotes();
    updateOverviewStats();
    showNotification(editingNoteId ? "Note updated." : "Note created.");
}

function setNoteSaving(saving) {
    if (!saveNoteButton) return;
    saveNoteButton.disabled = saving;
    saveNoteButton.textContent = saving
        ? "Saving..."
        : (editingNoteId ? "Save Changes" : "Save Note");
}

async function deleteNote(id) {
    const note = allNotes.find((item) => item.id === id);
    if (!note) return;

    if (!window.confirm(`Delete "${note.title}"?`)) return;

    const { error } = await supabaseClient
        .from("notes")
        .delete()
        .eq("id", id);

    if (error) {
        showNotification(getFriendlySupabaseError(error), "error");
        return;
    }

    allNotes = allNotes.filter((item) => item.id !== id);

    renderManagementNotes();
    renderRecentNotes();
    updateOverviewStats();

    showNotification("Note deleted.");
}

/* =========================================================
   PROJECTS
========================================================= */

function bindProjectEvents() {
    $("#newProjectButton")?.addEventListener("click", openNewProject);
    $("#managementNewProjectButton")?.addEventListener("click", openNewProject);

    projectForm?.addEventListener("submit", handleProjectSubmit);
    cancelProject?.addEventListener("click", closeProjectEditor);
    closeProjectModal?.addEventListener("click", closeProjectEditor);
    projectModalBackdrop?.addEventListener("click", closeProjectEditor);

    projectTitle?.addEventListener("input", generateProjectSlugFromTitle);
    projectSlug?.addEventListener("input", handleManualProjectSlugInput);

    $$("[data-project-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            currentProjectFilter = button.dataset.projectFilter || "all";
            updateProjectFilterButtons();
            renderManagementProjects();
        });
    });
}

async function loadProjects() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        renderManagementProjectsError(error);
        return;
    }

    allProjects = data || [];
}

function updateProjectFilterButtons() {
    $$("[data-project-filter]").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.projectFilter === currentProjectFilter
        );
    });
}

function renderManagementProjects() {
    if (!managementProjectsList) return;

    const projects = currentProjectFilter === "all"
        ? allProjects
        : allProjects.filter((project) => project.status === currentProjectFilter);

    if (projectsManagementCount) {
        projectsManagementCount.textContent =
            `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;
    }

    if (!projects.length) {
        managementProjectsList.innerHTML = `
            <div class="management-empty">
                <p class="eyebrow">Projects</p>
                <h3>No projects found</h3>
                <p>Create your first project to get started.</p>
            </div>
        `;
        return;
    }

    managementProjectsList.innerHTML = projects
        .map(createProjectManagementCard)
        .join("");

    bindProjectCardActions();
}

function renderManagementProjectsError(error) {
    if (!managementProjectsList) return;

    managementProjectsList.innerHTML = `
        <div class="management-empty">
            <p class="eyebrow">Projects</p>
            <h3>Unable to load projects</h3>
            <p>${escapeHtml(getFriendlySupabaseError(error))}</p>
        </div>
    `;
}

function createProjectManagementCard(project) {
    return `
        <article class="management-note-card">
            <div class="management-note-main">
                <p class="eyebrow">${escapeHtml(project.status || "draft")}</p>
                <h3>${escapeHtml(project.title || "Untitled")}</h3>
                <p>${escapeHtml(project.description || stripHtml(project.content || "").slice(0, 160))}</p>
                <span>${formatDate(project.updated_at || project.created_at)}</span>
            </div>

            <div class="management-note-actions">
                <button type="button" class="admin-small-button" data-edit-project="${escapeAttribute(project.id)}">
                    Edit
                </button>

                <button type="button" class="admin-small-button danger" data-delete-project="${escapeAttribute(project.id)}">
                    Delete
                </button>
            </div>
        </article>
    `;
}

function bindProjectCardActions() {
    $$("[data-edit-project]").forEach((button) => {
        button.addEventListener("click", () => {
            openEditProject(button.dataset.editProject);
        });
    });

    $$("[data-delete-project]").forEach((button) => {
        button.addEventListener("click", () => {
            deleteProject(button.dataset.deleteProject);
        });
    });
}

function renderOverviewProjects() {
    const target = $("#overviewProjectsList");
    if (!target) return;

    const projects = allProjects
        .filter((project) => project.status === "published")
        .slice(0, 3);

    if (!projects.length) {
        target.innerHTML = `
            <div class="management-empty">
                <p class="eyebrow">Projects</p>
                <h3>No published projects yet</h3>
                <p>Published projects will appear here.</p>
            </div>
        `;
        return;
    }

    target.innerHTML = projects.map(createOverviewProjectItem).join("");
    bindOverviewProjectActions();
}

function bindOverviewProjectActions() {
    $$('[data-overview-project]').forEach((item) => {
        item.onclick = () => navigateTo("projects");
    });
}

function createOverviewProjectItem(project) {
    return `
        <button type="button" class="overview-recent-item" data-overview-project="${escapeAttribute(project.id)}">
            <span class="overview-recent-copy">
                <strong>${escapeHtml(project.title || "Untitled")}</strong>
                <small>${escapeHtml(project.description || "Project")}</small>
            </span>
            <time>${formatDate(project.updated_at || project.created_at)}</time>
        </button>
    `;
}

function openNewProject() {
    editingProjectId = null;
    projectSlugManuallyEdited = false;

    projectForm?.reset();

    if (projectEditorEyebrow) projectEditorEyebrow.textContent = "New Project";
    if (projectEditorTitle) projectEditorTitle.textContent = "Create a project";
    if (saveProjectButton) saveProjectButton.textContent = "Save Project";

    if (projectContentEditor) projectContentEditor.innerHTML = "";
    if (projectContent) projectContent.value = "";

    if (projectSortOrder) projectSortOrder.value = "0";

    openModal(projectModal);
    projectTitle?.focus();
}

function openEditProject(id) {
    const project = allProjects.find((item) => item.id === id);
    if (!project) return;

    editingProjectId = project.id;

    const generated = slugify(project.title || "");
    projectSlugManuallyEdited = Boolean(
        project.slug && project.slug !== generated
    );

    if (projectEditorEyebrow) projectEditorEyebrow.textContent = "Edit Project";
    if (projectEditorTitle) projectEditorTitle.textContent = "Update your project";
    if (saveProjectButton) saveProjectButton.textContent = "Save Changes";

    if (projectTitle) projectTitle.value = project.title || "";
    if (projectSlug) projectSlug.value = project.slug || "";
    if (projectDescription) projectDescription.value = project.description || "";
    if (projectThumbnail) projectThumbnail.value = project.thumbnail || "";
    if (projectTechStack) projectTechStack.value = Array.isArray(project.tech_stack)
        ? project.tech_stack.join(", ")
        : "";
    if (projectUrl) projectUrl.value = project.project_url || "";
    if (projectGithubUrl) projectGithubUrl.value = project.github_url || "";
    if (projectStatus) projectStatus.value = project.status || "draft";
    if (projectFeatured) projectFeatured.value = project.featured ? "true" : "false";
    if (projectSortOrder) projectSortOrder.value = String(project.sort_order ?? 0);

    if (projectContentEditor) {
        projectContentEditor.innerHTML = sanitizeHtml(project.content || "");
    }
    syncProjectEditorContent();

    openModal(projectModal);
    projectTitle?.focus();
}

function generateProjectSlugFromTitle() {
    if (!projectSlug || projectSlugManuallyEdited) return;
    projectSlug.value = slugify(projectTitle?.value || "");
}

function handleManualProjectSlugInput() {
    if (!projectSlug) return;
    projectSlugManuallyEdited = true;
    projectSlug.value = slugify(projectSlug.value);
}

async function handleProjectSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
        showNotification("Please sign in first.", "error");
        return;
    }

    syncProjectEditorContent();

    const title = projectTitle?.value.trim();
    const slug = projectSlug?.value.trim() || slugify(title);

    if (!title || !slug) {
        showNotification("Title and slug are required.", "error");
        return;
    }

    setProjectSaving(true);

    const existing = editingProjectId
        ? allProjects.find((project) => project.id === editingProjectId)
        : null;

    const status = projectStatus?.value || "draft";

    const payload = {
        title,
        slug,
        description: projectDescription?.value.trim() || null,
        content: projectContent?.value || "",
        thumbnail: projectThumbnail?.value.trim() || null,
        tech_stack: parseTechStack(projectTechStack?.value || ""),
        project_url: projectUrl?.value.trim() || null,
        github_url: projectGithubUrl?.value.trim() || null,
        status,
        featured: projectFeatured?.value === "true",
        sort_order: Number.parseInt(projectSortOrder?.value, 10) || 0,
        published_at: status === "published"
            ? (existing?.published_at || new Date().toISOString())
            : null
    };

    let result;

    if (editingProjectId) {
        result = await supabaseClient
            .from("projects")
            .update(payload)
            .eq("id", editingProjectId)
            .select()
            .single();
    } else {
        result = await supabaseClient
            .from("projects")
            .insert(payload)
            .select()
            .single();
    }

    if (result.error) {
        setProjectSaving(false);
        showNotification(getFriendlySupabaseError(result.error), "error");
        return;
    }

    if (editingProjectId) {
        allProjects = allProjects.map((project) =>
            project.id === editingProjectId ? result.data : project
        );
    } else {
        allProjects.push(result.data);
    }

    allProjects.sort((a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );

    setProjectSaving(false);
    closeProjectEditor();
    renderManagementProjects();
    renderOverviewProjects();
    updateOverviewStats();

    showNotification(editingProjectId ? "Project updated." : "Project created.");
}

function setProjectSaving(saving) {
    if (!saveProjectButton) return;
    saveProjectButton.disabled = saving;
    saveProjectButton.textContent = saving
        ? "Saving..."
        : (editingProjectId ? "Save Changes" : "Save Project");
}

async function deleteProject(id) {
    const project = allProjects.find((item) => item.id === id);
    if (!project) return;

    if (!window.confirm(`Delete "${project.title}"?`)) return;

    const { error } = await supabaseClient
        .from("projects")
        .delete()
        .eq("id", id);

    if (error) {
        showNotification(getFriendlySupabaseError(error), "error");
        return;
    }

    allProjects = allProjects.filter((item) => item.id !== id);

    renderManagementProjects();
    renderOverviewProjects();
    updateOverviewStats();

    showNotification("Project deleted.");
}

function parseTechStack(value) {
    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

/* =========================================================
   EDITORS
========================================================= */

function bindEditorEvents() {
    $$("[data-command]").forEach((button) => {
        button.addEventListener("mousedown", (event) => {
            event.preventDefault();
        });

        button.addEventListener("click", () => {
            executeEditorCommand(
                button.dataset.command,
                button.dataset.value
            );
        });
    });

    bindLinkButton(editorLinkButton, noteContentEditor);
    editorImageButton?.addEventListener("click", () => {
        saveEditorSelection(noteContentEditor);
        noteEditorImageInput?.click();
    });
    noteEditorImageInput?.addEventListener("change", () => insertEditorImage(noteEditorImageInput, noteContentEditor));
}

function bindProjectEditorEvents() {
    $$("[data-project-command]").forEach((button) => {
        button.addEventListener("mousedown", (event) => {
            event.preventDefault();
        });

        button.addEventListener("click", () => {
            executeEditorCommand(
                button.dataset.projectCommand,
                button.dataset.projectValue,
                projectContentEditor
            );
        });
    });

    bindLinkButton($("#projectEditorLinkButton"), projectContentEditor);
    projectEditorImageButton?.addEventListener("click", () => {
        saveEditorSelection(projectContentEditor);
        projectEditorImageInput?.click();
    });
    projectEditorImageInput?.addEventListener("change", () => insertEditorImage(projectEditorImageInput, projectContentEditor));
}

function executeEditorCommand(command, value, editor = noteContentEditor) {
    if (!editor) return;

    editor.focus();

    if (command === "formatBlock") {
        document.execCommand(command, false, `<${value}>`);
    } else {
        document.execCommand(command, false, value || null);
    }

    if (editor === noteContentEditor) {
        syncNoteEditorContent();
    } else {
        syncProjectEditorContent();
    }
}

function insertEditorLink(editor = noteContentEditor) {
    if (!editor) return;

    restoreEditorSelection(editor);
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed || !editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
        showNotification("Select the text you want to link first.", "error");
        return;
    }

    // Keep a fresh copy while the browser-owned prompt temporarily takes focus.
    savedEditorRange = selection.getRangeAt(0).cloneRange();

    const url = window.prompt("Enter URL:");
    if (!url) return;

    const safeUrl = normalizeEditorLink(url);
    if (!safeUrl) {
        showNotification("Please enter a valid link.", "error");
        return;
    }

    // The prompt can move focus in some browsers, so restore the captured range
    // immediately before applying the command.
    restoreEditorSelection(editor);
    editor.focus();
    document.execCommand("createLink", false, safeUrl);

    if (editor === noteContentEditor) {
        syncNoteEditorContent();
    } else {
        syncProjectEditorContent();
    }
}

function bindLinkButton(button, editor) {
    if (!button || !editor) return;

    button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        saveEditorSelection(editor);
    });

    button.addEventListener("click", () => insertEditorLink(editor));
}

function normalizeEditorLink(value) {
    const url = String(value || "").trim();
    if (!url || /^javascript:/i.test(url) || /^data:/i.test(url)) return "";
    if (/^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/|\?)/i.test(url)) return url;
    return `https://${url}`;
}

async function insertEditorImage(input, editor) {
    const file = input?.files?.[0];
    if (!file || !editor) return;
    input.value = "";

    if (!currentUser) {
        showNotification("Please sign in first.", "error");
        return;
    }
    if (!/^image\/(png|jpeg|webp|gif|avif)$/i.test(file.type)) {
        showNotification("Choose a PNG, JPEG, WebP, GIF, or AVIF image.", "error");
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showNotification("Images must be 10 MB or smaller.", "error");
        return;
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "img";
    const filename = `editor-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const { error } = await supabaseClient.storage.from("media").upload(filename, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false
    });
    if (error) {
        showNotification(getFriendlySupabaseError(error), "error");
        return;
    }

    const oldImages = new Set(editor.querySelectorAll("img"));
    editor.focus();
    restoreEditorSelection(editor);
    document.execCommand("insertImage", false, getMediaPublicUrl(filename));
    const image = [...editor.querySelectorAll("img")].find((item) => !oldImages.has(item));
    if (image) image.alt = file.name.replace(/\.[^/.]+$/, "");
    if (editor === noteContentEditor) syncNoteEditorContent(); else syncProjectEditorContent();
    showNotification("Image uploaded and inserted.");
}

function saveEditorSelection(editor) {
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) savedEditorRange = range.cloneRange();
}

function restoreEditorSelection(editor) {
    if (!editor || !savedEditorRange) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedEditorRange);
    savedEditorRange = null;
}

function syncNoteEditorContent() {
    if (!noteContentEditor || !noteContent) return;
    noteContent.value = sanitizeHtml(noteContentEditor.innerHTML);
}

function syncProjectEditorContent() {
    if (!projectContentEditor || !projectContent) return;
    projectContent.value = sanitizeHtml(projectContentEditor.innerHTML);
}

function syncEditors() {
    syncNoteEditorContent();
    syncProjectEditorContent();
}

/* =========================================================
   MEDIA
========================================================= */

function bindMediaEvents() {
    mediaUploadButton?.addEventListener("click", () => {
        mediaFileInput?.click();
    });

    mediaFileInput?.addEventListener("change", handleMediaUpload);
    mediaSearch?.addEventListener("input", renderMedia);
}

async function loadMedia() {
    if (!currentUser || !mediaList) return;

    const { data, error } = await supabaseClient
        .storage
        .from("media")
        .list("", {
            limit: 100,
            sortBy: { column: "created_at", order: "desc" }
        });

    if (error) {
        mediaList.innerHTML = `
            <div class="admin-empty">${escapeHtml(getFriendlySupabaseError(error))}</div>
        `;
        return;
    }

    allMedia = data || [];
    renderMedia();
}

function renderMedia() {
    if (!mediaList) return;

    const query = (mediaSearch?.value || "").trim().toLowerCase();

    const files = allMedia.filter((file) =>
        !query || file.name.toLowerCase().includes(query)
    );

    if (!files.length) {
        mediaList.innerHTML = `<div class="admin-empty">No media found.</div>`;
        return;
    }

    mediaList.innerHTML = files.map((file) => `
        <div class="admin-panel-row">
            <div class="admin-panel-main">
                <div class="admin-panel-title">${escapeHtml(file.name)}</div>
                <div class="admin-panel-meta">${formatBytes(file.metadata?.size || 0)}</div>
            </div>
            <div class="admin-panel-actions">
                <button type="button" class="admin-small-button" data-copy-media="${escapeAttribute(file.name)}">Copy URL</button>
                <button type="button" class="admin-small-button danger" data-delete-media="${escapeAttribute(file.name)}">Delete</button>
            </div>
        </div>
    `).join("");

    $$("[data-copy-media]").forEach((button) => {
        button.addEventListener("click", async () => {
            const url = getMediaPublicUrl(button.dataset.copyMedia);
            await navigator.clipboard?.writeText(url);
            showNotification("Media URL copied.");
        });
    });

    $$("[data-delete-media]").forEach((button) => {
        button.addEventListener("click", () => deleteMedia(button.dataset.deleteMedia));
    });
}

async function handleMediaUpload() {
    const file = mediaFileInput?.files?.[0];
    if (!file) return;

    if (!currentUser) {
        showNotification("Please sign in first.", "error");
        return;
    }

    const extension = file.name.includes(".")
        ? file.name.split(".").pop().toLowerCase()
        : "bin";

    const safeBase = slugify(file.name.replace(/\.[^/.]+$/, "")) || "file";
    const filename = `${Date.now()}-${safeBase}.${extension}`;

    const { error } = await supabaseClient
        .storage
        .from("media")
        .upload(filename, file, {
            cacheControl: "3600",
            upsert: false
        });

    mediaFileInput.value = "";

    if (error) {
        showNotification(getFriendlySupabaseError(error), "error");
        return;
    }

    await loadMedia();
    showNotification("Media uploaded.");
}

function getMediaPublicUrl(name) {
    const { data } = supabaseClient
        .storage
        .from("media")
        .getPublicUrl(name);

    return data?.publicUrl || "";
}

async function deleteMedia(name) {
    if (!window.confirm(`Delete "${name}"?`)) return;

    const { error } = await supabaseClient
        .storage
        .from("media")
        .remove([name]);

    if (error) {
        showNotification(getFriendlySupabaseError(error), "error");
        return;
    }

    await loadMedia();
    showNotification("Media deleted.");
}

function formatBytes(bytes) {
    if (!bytes) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

/* =========================================================
   MESSAGES
========================================================= */

function bindMessageEvents() {
    messageSearch?.addEventListener("input", renderMessages);
}

async function loadMessages() {
    if (!currentUser || !messagesList) return;

    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        messagesList.innerHTML = `
            <div class="admin-empty">${escapeHtml(getFriendlySupabaseError(error))}</div>
        `;
        return;
    }

    allMessages = data || [];
    renderMessages();
}

function renderMessages() {
    if (!messagesList) return;

    const query = (messageSearch?.value || "").trim().toLowerCase();

    const messages = allMessages.filter((message) => {
        if (!query) return true;

        return [
            message.name,
            message.email,
            message.subject,
            message.message
        ].some((value) =>
            String(value || "").toLowerCase().includes(query)
        );
    });

    if (!messages.length) {
        messagesList.innerHTML = `<div class="admin-empty">No messages found.</div>`;
        return;
    }

    messagesList.innerHTML = messages.map((message) => `
        <div class="admin-panel-row">
            <div class="admin-panel-main">
                <div class="admin-panel-title">
                    ${escapeHtml(message.subject || "New message")}
                </div>
                <div class="admin-panel-meta">
                    ${escapeHtml(message.name || "Unknown")} · ${escapeHtml(message.email || "")}
                    · ${formatDate(message.created_at)}
                </div>
            </div>
            <div class="admin-panel-actions">
                <button type="button" class="admin-small-button" data-view-message="${escapeAttribute(message.id)}">
                    View
                </button>
                <button type="button" class="admin-small-button danger" data-delete-message="${escapeAttribute(message.id)}">
                    Delete
                </button>
            </div>
        </div>
    `).join("");

    $$("[data-view-message]").forEach((button) => {
        button.addEventListener("click", () => {
            const message = allMessages.find((item) => item.id === button.dataset.viewMessage);
            if (!message) return;

            window.alert(
                `${message.subject || "Message"}\n\n` +
                `From: ${message.name || ""} <${message.email || ""}>\n\n` +
                `${message.message || ""}`
            );
        });
    });

    $$("[data-delete-message]").forEach((button) => {
        button.addEventListener("click", () => deleteMessage(button.dataset.deleteMessage));
    });
}

async function deleteMessage(id) {
    if (!window.confirm("Delete this message?")) return;

    const { error } = await supabaseClient
        .from("messages")
        .delete()
        .eq("id", id);

    if (error) {
        showNotification(getFriendlySupabaseError(error), "error");
        return;
    }

    allMessages = allMessages.filter((message) => message.id !== id);
    renderMessages();
    updateOverviewStats();
    showNotification("Message deleted.");
}

/* =========================================================
   SETTINGS
========================================================= */

function bindSettingsEvents() {
    settingsForm?.addEventListener("submit", (event) => {
        event.preventDefault();

        try {
            localStorage.setItem(
                "ardanarx_admin_settings",
                JSON.stringify({
                    name: settingsName?.value || "",
                    siteUrl: settingsSiteUrl?.value || "",
                    notifications: Boolean(settingsNotifications?.checked)
                })
            );

            showNotification("Settings saved.");
        } catch (error) {
            console.error(error);
            showNotification("Could not save settings.", "error");
        }
    });

    loadLocalSettings();
}

function loadLocalSettings() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("ardanarx_admin_settings") || "null"
        );

        if (!saved) return;

        if (settingsName) settingsName.value = saved.name || "";
        if (settingsSiteUrl) settingsSiteUrl.value =
            saved.siteUrl || "https://ardanarx.vercel.app/";
        if (settingsNotifications) settingsNotifications.checked =
            saved.notifications !== false;
    } catch {
        /* ignore invalid local settings */
    }
}

/* =========================================================
   MODALS
========================================================= */

function openModal(modal) {
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add("modal-open");
}

function closeModal(modal) {
    if (!modal) return;

    modal.hidden = true;

    if (noteModal?.hidden !== false && projectModal?.hidden !== false) {
        document.body.classList.remove("modal-open");
    }
}

function closeNoteEditor() {
    editingNoteId = null;
    slugManuallyEdited = false;
    closeModal(noteModal);
}

function closeProjectEditor() {
    editingProjectId = null;
    projectSlugManuallyEdited = false;
    closeModal(projectModal);
}

/* =========================================================
   OVERVIEW
========================================================= */

async function updateOverviewStats() {
    if (notesStat) notesStat.textContent = formatStatNumber(allNotes.length);
    if (projectsStat) projectsStat.textContent = formatStatNumber(allProjects.length);

    if (publishedStat) {
        const published =
            allNotes.filter((note) => note.status === "published").length +
            allProjects.filter((project) => project.status === "published").length;

        publishedStat.textContent = formatStatNumber(published);
    }

    const messagesStat = document.querySelector("[data-stat-messages]");
    if (messagesStat) {
        if (!allMessages.length && currentUser) {
            await loadMessages();
        }
        messagesStat.textContent = formatStatNumber(allMessages.length);
    }
}

function formatStatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

/* =========================================================
   SANITIZATION
========================================================= */

function sanitizeHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");

    const allowedTags = new Set([
        "P", "BR", "H2", "H3", "STRONG", "B", "EM", "I",
        "UL", "OL", "LI", "BLOCKQUOTE", "A", "CODE", "PRE",
        "IMG", "HR"
    ]);

    const allowedAttrs = {
        A: new Set(["href", "target", "rel"]),
        IMG: new Set(["src", "alt", "title"])
    };

    const walker = document.createTreeWalker(
        template.content,
        NodeFilter.SHOW_ELEMENT
    );

    const elements = [];
    while (walker.nextNode()) elements.push(walker.currentNode);

    elements.forEach((element) => {
        if (!allowedTags.has(element.tagName)) {
            element.replaceWith(
                document.createTextNode(element.textContent || "")
            );
            return;
        }

        [...element.attributes].forEach((attribute) => {
            const allowed = allowedAttrs[element.tagName]?.has(attribute.name);

            if (!allowed) {
                element.removeAttribute(attribute.name);
                return;
            }

            if (element.tagName === "A" && attribute.name === "href") {
                const value = attribute.value.trim();

                if (!/^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/|\?)/i.test(value)) {
                    element.removeAttribute("href");
                }
            }

            if (element.tagName === "IMG" && attribute.name === "src") {
                const value = attribute.value.trim();

                if (!/^https?:\/\//i.test(value)) {
                    element.removeAttribute("src");
                }
            }
        });

        if (element.tagName === "A") {
            element.setAttribute("target", "_blank");
            element.setAttribute("rel", "noopener noreferrer");
        }
    });

    return template.innerHTML;
}

function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = String(html || "");
    return div.textContent || "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function formatDate(value) {
    if (!value) return "No date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "No date";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function showNotification(message, type = "success") {
    if (!notification) return;

    if (notificationMessage) {
        notificationMessage.textContent = message;
    } else {
        notification.textContent = message;
    }

    notification.dataset.type = type;
    notification.classList.add("show");

    clearTimeout(notificationTimer);

    notificationTimer = setTimeout(() => {
        notification.classList.remove("show");
    }, 3200);
}

function getFriendlySupabaseError(error) {
    if (!error) return "Something went wrong.";

    const message = error.message || String(error);

    if (/duplicate key|unique constraint/i.test(message)) {
        return "That slug already exists. Please choose another one.";
    }

    if (/row-level security|permission denied/i.test(message)) {
        return "Supabase permissions blocked this action. Check your RLS policies.";
    }

    if (/invalid login credentials/i.test(message)) {
        return "The email or password is incorrect.";
    }

    return message;
}

/* =========================================================
   KEYBOARD / PAGE EVENTS
========================================================= */

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (noteModal && !noteModal.hidden) {
        closeNoteEditor();
        return;
    }

    if (projectModal && !projectModal.hidden) {
        closeProjectEditor();
        return;
    }

    closeMobileSidebar();
});

window.addEventListener("beforeunload", syncEditors);
