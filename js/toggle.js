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
document.addEventListener('DOMContentLoaded', initializeDarkMode);
