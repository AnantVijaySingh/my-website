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

function readSavedTheme(): string | null {
    try {
        return localStorage.getItem(THEME_KEY);
    } catch {
        return null; // private mode, blocked storage, etc.
    }
}

function applyTheme(dark: boolean): void {
    if (dark) {
        root.setAttribute('data-theme', 'dark');
    } else {
        root.removeAttribute('data-theme');
    }
}

function initializeThemeToggle(): void {
    const toggleSwitch = document.getElementById('switch') as HTMLInputElement | null;
    const isDark = readSavedTheme() === 'dark';

    applyTheme(isDark);
    if (toggleSwitch) {
        toggleSwitch.checked = isDark;
    }

    toggleSwitch?.addEventListener('change', () => {
        const dark = toggleSwitch.checked;
        applyTheme(dark);
        try {
            localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
        } catch {
            // Storage unavailable: the theme still applies for this page view.
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeThemeToggle);
