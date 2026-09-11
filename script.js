/* =========================================================
   ARDANARX
   MAIN JAVASCRIPT
   SYSTEM THEME + MOBILE MENU + SMOOTH SCROLL
   ========================================================= */


document.addEventListener("DOMContentLoaded", () => {


    /* =====================================================
       SYSTEM THEME
       Automatically follows device settings
    ====================================================== */

    const systemTheme =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    function applySystemTheme() {

        const isDark =
            systemTheme.matches;


        document.documentElement.classList.toggle(
            "dark-mode",
            isDark
        );

    }


    /* Apply theme when page opens */

    applySystemTheme();


    /* Update automatically when device theme changes */

    if (
        typeof systemTheme.addEventListener ===
        "function"
    ) {

        systemTheme.addEventListener(
            "change",
            applySystemTheme
        );

    } else {

        /* Support older browsers */

        systemTheme.addListener(
            applySystemTheme
        );

    }


    /* =====================================================
       ELEMENTS
    ====================================================== */

    const menuToggle =
        document.querySelector(".menu-toggle");


    const mobileMenu =
        document.querySelector(".mobile-menu");


    const mobileLinks =
        document.querySelectorAll(
            ".mobile-menu a"
        );


    /* =====================================================
       MOBILE MENU
    ====================================================== */

    function closeMobileMenu() {

        if (!menuToggle || !mobileMenu) {
            return;
        }


        mobileMenu.classList.remove(
            "active"
        );


        menuToggle.classList.remove(
            "active"
        );


        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );


        menuToggle.setAttribute(
            "aria-label",
            "Buka menu"
        );

    }


    function openMobileMenu() {

        if (!menuToggle || !mobileMenu) {
            return;
        }


        mobileMenu.classList.add(
            "active"
        );


        menuToggle.classList.add(
            "active"
        );


        menuToggle.setAttribute(
            "aria-expanded",
            "true"
        );


        menuToggle.setAttribute(
            "aria-label",
            "Tutup menu"
        );

    }


    /* =====================================================
       MENU TOGGLE
    ====================================================== */

    if (menuToggle && mobileMenu) {

        menuToggle.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();


                const isOpen =
                    mobileMenu.classList.contains(
                        "active"
                    );


                if (isOpen) {

                    closeMobileMenu();

                } else {

                    openMobileMenu();

                }

            }
        );


        /* Close after clicking link */

        mobileLinks.forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    closeMobileMenu();

                }

            );

        });


        /* Close when clicking outside */

        document.addEventListener(
            "click",
            (event) => {

                const clickedMenu =
                    mobileMenu.contains(
                        event.target
                    );


                const clickedButton =
                    menuToggle.contains(
                        event.target
                    );


                if (
                    !clickedMenu &&
                    !clickedButton
                ) {

                    closeMobileMenu();

                }

            }

        );


        /* Close with ESC */

        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Escape"
                ) {

                    closeMobileMenu();

                }

            }

        );

    }


    /* =====================================================
       SMOOTH SCROLL
    ====================================================== */

    const internalLinks =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    internalLinks.forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                const targetId =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }


                const target =
                    document.querySelector(
                        targetId
                    );


                if (!target) {
                    return;
                }


                event.preventDefault();


                target.scrollIntoView({

                    behavior: "smooth",

                    block: "start"

                });

            }

        );

    });




    /* =====================================================
       SUPABASE — PUBLIC CONTENT
       Shared backend with Ardanarx Admin
    ====================================================== */

    const SUPABASE_URL =
        "https://isqimtsaeuvceijapddj.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_SrJsbjs-_hunnBhCTlKywA_JxtScx3t";

    const supabaseClient =
        window.supabase
            ? window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            )
            : null;


    function escapePublicHTML(value) {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatPublicDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(date);
    }


    /* =====================================================
       HOMEPAGE NOTES
    ====================================================== */

    async function loadHomepageNotes() {

        const notesList =
            document.getElementById("homeNotesList");

        if (!notesList || !supabaseClient) {
            return;
        }

        const { data, error } =
            await supabaseClient
                .from("notes")
                .select(`
                    id,
                    title,
                    slug,
                    excerpt,
                    status,
                    published_at,
                    created_at
                `)
                .eq("status", "published")
                .order("published_at", {
                    ascending: false
                })
                .limit(5);

        if (error) {
            console.error(
                "Failed to load homepage notes:",
                error
            );

            notesList.innerHTML = `
                <div class="note-item">
                    <p>Unable to load notes right now.</p>
                </div>
            `;

            return;
        }

        if (!data || data.length === 0) {
            notesList.innerHTML = `
                <div class="note-item">
                    <p>No published notes yet.</p>
                </div>
            `;

            return;
        }

        notesList.innerHTML =
            data.map(note => {

                const slug =
                    encodeURIComponent(
                        note.slug || ""
                    );

                return `
                    <article class="note-item">

                        <h3>
                            ${escapePublicHTML(note.title)}
                        </h3>

                        <p>
                            ${escapePublicHTML(
                                note.excerpt ||
                                "A note by Ardanarx."
                            )}
                        </p>

                        <a
                            href="notes/article.html?slug=${slug}"
                            class="text-link"
                        >
                            Read Note →
                        </a>

                    </article>
                `;

            }).join("");

    }


    /* =====================================================
       PUBLIC PROJECTS
    ====================================================== */

    async function loadPublicProjects() {

        const projectsList =
            document.getElementById("projectsList");

        if (!projectsList || !supabaseClient) {
            return;
        }

        const { data, error } =
            await supabaseClient
                .from("projects")
                .select(`
                    id,
                    title,
                    slug,
                    description,
                    category,
                    status,
                    sort_order,
                    project_url,
                    github_url,
                    technologies,
                    created_at
                `)
                .eq("status", "published")
                .order("sort_order", {
                    ascending: true
                })
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            console.error(
                "Failed to load projects:",
                error
            );

            projectsList.innerHTML = `
                <div class="project-item">
                    <p>Unable to load projects right now.</p>
                </div>
            `;

            return;
        }

        if (!data || data.length === 0) {
            projectsList.innerHTML = `
                <div class="project-item">
                    <p>No published projects yet.</p>
                </div>
            `;

            return;
        }

        projectsList.innerHTML =
            data.map((project, index) => {

                const number =
                    String(index + 1).padStart(2, "0");

                const tags =
                    Array.isArray(project.technologies)
                        ? project.technologies
                        : typeof project.technologies === "string"
                            ? project.technologies
                                .split(",")
                                .map(item => item.trim())
                                .filter(Boolean)
                            : [];

                const slug =
                    String(project.slug || "")
                        .toLowerCase()
                        .trim();

                /*
                 * Keep the existing local project pages
                 * for the three original Ardanarx projects.
                 * Admin-created projects may use project_url.
                 */

                const localProjectPages = {
                    vervocare: "vervocare/index.html",
                    kostiqo: "kostiqo/index.html",
                    nerforit: "nerforit/index.html"
                };

                const projectHref =
                    localProjectPages[slug] ||
                    project.project_url ||
                    "";

                const linkHTML =
                    projectHref
                        ? `
                            <a
                                href="${escapePublicHTML(projectHref)}"
                                class="project-link"
                                ${projectHref.startsWith("http")
                                    ? 'target="_blank" rel="noopener noreferrer"'
                                    : ""}
                            >
                                View Project
                            </a>
                          `
                        : "";

                return `
                    <article class="project-item">

                        <span class="project-number">
                            ${number} — ${escapePublicHTML(
                                project.category ||
                                "PROJECT"
                            ).toUpperCase()}
                        </span>

                        <h2>
                            ${escapePublicHTML(
                                project.title
                            )}
                        </h2>

                        <p>
                            ${escapePublicHTML(
                                project.description || ""
                            )}
                        </p>

                        ${
                            tags.length
                                ? `
                                    <div class="project-tags">
                                        ${tags.map(tag => `
                                            <span>
                                                ${escapePublicHTML(tag)}
                                            </span>
                                        `).join("")}
                                    </div>
                                  `
                                : ""
                        }

                        ${linkHTML}

                    </article>
                `;

            }).join("");

    }


    /* =====================================================
       PUBLIC CONTACT FORM → MESSAGES
    ====================================================== */

    async function setupContactForm() {

        const form =
            document.getElementById("contactForm");

        if (!form || !supabaseClient) {
            return;
        }

        const submitButton =
            form.querySelector("button[type='submit']");

        const formStatus =
            document.getElementById("contactFormStatus");

        form.addEventListener("submit", async event => {

            event.preventDefault();

            const formData =
                new FormData(form);

            const name =
                String(formData.get("name") || "").trim();

            const email =
                String(formData.get("email") || "").trim();

            const subject =
                String(formData.get("subject") || "").trim();

            const message =
                String(formData.get("message") || "").trim();

            if (!name || !email || !message) {
                if (formStatus) {
                    formStatus.textContent =
                        "Please complete the required fields.";
                }
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Sending...";
            }

            if (formStatus) {
                formStatus.textContent = "";
            }

            const { error } =
                await supabaseClient
                    .from("messages")
                    .insert({
                        name,
                        email,
                        subject: subject || "Website Contact",
                        message,
                        status: "unread"
                    });

            if (error) {

                console.error(
                    "Failed to send message:",
                    error
                );

                if (formStatus) {
                    formStatus.textContent =
                        "Something went wrong. Please try again later.";
                }

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Send Message";
                }

                return;
            }

            form.reset();

            if (formStatus) {
                formStatus.textContent =
                    "Message sent. Thank you for reaching out.";
            }

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Send Message";
            }

        });

    }


    loadHomepageNotes();
    loadPublicProjects();
    setupContactForm();

});