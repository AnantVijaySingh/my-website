"use strict";
function initializeDarkMode() {
    const toggleSwitch = document.getElementById('switch');
    const body = document.body;
    // Load the saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (toggleSwitch) {
            toggleSwitch.checked = true;
        }
    }
    // Add event listener to toggle
    toggleSwitch === null || toggleSwitch === void 0 ? void 0 : toggleSwitch.addEventListener('change', () => {
        const isDark = toggleSwitch === null || toggleSwitch === void 0 ? void 0 : toggleSwitch.checked;
        body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}
// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();

    // New code for hide-on-scroll header
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;
    let ticking = false;

    // Check if it's a mobile view (based on our CSS media query)
    const isMobile = () => window.matchMedia('(max-width: 600px)').matches;

    function updateHeaderVisibility() {
        if (!isMobile()) {
            // If not mobile, ensure header is visible and remove any hidden class
            header.classList.remove('header-hidden');
            ticking = false;
            return;
        }

        const currentScrollY = window.scrollY;

        // Only hide if scrolling down AND not at the very top (to allow immediate scroll up reveal)
        if (currentScrollY > lastScrollY && currentScrollY > header.offsetHeight) {
            header.classList.add('header-hidden');
        } else if (currentScrollY < lastScrollY) { // Scrolling up
            header.classList.remove('header-hidden');
        }
        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeaderVisibility);
            ticking = true;
        }
    });

    // Also update on resize to handle orientation changes or window resizing
    window.addEventListener('resize', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeaderVisibility);
            ticking = true;
        }
    });

    // Initial check on load to ensure correct state if page is loaded mid-scroll or on mobile
    updateHeaderVisibility();
});