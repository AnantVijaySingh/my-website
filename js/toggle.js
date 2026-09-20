"use strict";
/**
 * Theme toggle.
 *
 * The theme lives on <html data-theme="dark">, which the tokens in
 * css/styles.css respond to. An inline script in each page's <head> applies the
 * saved theme before first paint so there is no flash; this file only wires the
 * switch and persists the choice.
 */
const THEME_KEY = 'theme';
const root = document.documentElement;
function readSavedTheme() {
    try {
        return localStorage.getItem(THEME_KEY);
    }
    catch (_a) {
        return null; // private mode, blocked storage, etc.
    }
}
function applyTheme(dark) {
    if (dark) {
        root.setAttribute('data-theme', 'dark');
    }
    else {
        root.removeAttribute('data-theme');
    }
}
function initializeThemeToggle() {
    const toggleSwitch = document.getElementById('switch');
    const isDark = readSavedTheme() === 'dark';
    applyTheme(isDark);
    if (toggleSwitch) {
        toggleSwitch.checked = isDark;
    }
    toggleSwitch === null || toggleSwitch === void 0 ? void 0 : toggleSwitch.addEventListener('change', () => {
        const dark = toggleSwitch.checked;
        applyTheme(dark);
        try {
            localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
        }
        catch (_a) {
            // Storage unavailable: the theme still applies for this page view.
        }
    });
}
document.addEventListener('DOMContentLoaded', initializeThemeToggle);
