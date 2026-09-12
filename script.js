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


});